<?php

namespace App\Services\Integrations;

use App\Enums\DocumentType;
use App\Models\Animal;
use App\Models\ChipRegistration;
use App\Models\HandoffToken;
use App\Models\Organization;
use App\Models\Owner;
use App\Models\Plan;
use App\Models\RegistrationPayment;
use App\Support\AnimalSex;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class HandoffRegistrationService
{
    public function __construct(
        private readonly VetSaasWebhookDispatcher $webhooks,
        private readonly HandoffTokenService $tokens,
    ) {}

    /**
     * Confirma el handoff: crea org + owner + animal + chip pending_payment
     * SIN cobro. El dueño activa después en AlmaPet (login + pago).
     *
     * @return array{registration: ChipRegistration, activate_url: string, pricing: array{channel: string, amount: float, platform_amount: float, clinic_commission: float, currency: string, physical_amount: float}}
     */
    public function confirm(HandoffToken $token): array
    {
        if (! $token->isConsumable()) {
            throw ValidationException::withMessages([
                'token' => 'Este enlace ya no es válido.',
            ]);
        }

        $payload = $token->payload;
        $result = $this->registerPendingFromPayload($payload, markToken: $token);

        return $result;
    }

    /**
     * Alta directa desde API VetSaaS (sin token web ni Culqi).
     *
     * @param  array<string, mixed>  $payload
     * @return array{registration: ChipRegistration, activate_url: string, pricing: array{channel: string, amount: float, platform_amount: float, clinic_commission: float, currency: string, physical_amount: float}}
     */
    public function registerFromVetSaas(array $payload): array
    {
        return $this->registerPendingFromPayload($payload, markToken: null);
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array{registration: ChipRegistration, activate_url: string, pricing: array{channel: string, amount: float, platform_amount: float, clinic_commission: float, currency: string, physical_amount: float}}
     */
    private function registerPendingFromPayload(array $payload, ?HandoffToken $markToken): array
    {
        $microchip = preg_replace('/\D+/', '', (string) ($payload['microchip'] ?? '')) ?? '';
        $tenantId = (string) ($payload['vetsaas_tenant_id'] ?? '');
        $pacienteId = (string) ($payload['vetsaas_paciente_id'] ?? '');

        $existing = ChipRegistration::query()
            ->where(function ($q) use ($microchip, $tenantId, $pacienteId): void {
                $q->where('microchip', $microchip);
                if ($tenantId !== '' && $pacienteId !== '') {
                    $q->orWhere(function ($inner) use ($tenantId, $pacienteId): void {
                        $inner->where('vetsaas_tenant_id', $tenantId)
                            ->where('vetsaas_paciente_id', $pacienteId);
                    });
                }
            })
            ->latest('id')
            ->first();

        $plan = $this->resolveRegistrationPlan();
        $pricing = $plan->pricingFor(Plan::CHANNEL_VETSAAS);
        $pricing['physical_amount'] = (float) config('almapet.physical_carnet_amount', 30);

        if ($existing !== null) {
            if ($existing->isPendingPayment()) {
                $this->applyAnimalPhotoFromPayload($existing->animal, is_array($payload['animal'] ?? null) ? $payload['animal'] : []);

                if ($markToken !== null) {
                    $this->tokens->markUsed($markToken);
                }

                return [
                    'registration' => $existing->fresh(['animal.owner', 'organization']) ?? $existing,
                    'activate_url' => $this->activateUrl($existing),
                    'pricing' => $pricing,
                ];
            }

            // Ya activo/perdido: no re-registra aquí (usar sync-photo).
            throw ValidationException::withMessages([
                'microchip' => $existing->microchip === $microchip
                    ? 'Este microchip ya está registrado en AlmaPet ID.'
                    : 'Este paciente ya tiene un registro AlmaPet vinculado.',
            ]);
        }

        $registration = DB::transaction(function () use ($payload, $microchip, $tenantId, $pacienteId, $markToken): ChipRegistration {
            $org = $this->resolveOrganization($payload);
            $owner = $this->upsertOwner($payload['owner'] ?? [], $org->id);

            $animalPayload = is_array($payload['animal'] ?? null) ? $payload['animal'] : [];

            $animal = Animal::query()->create([
                'owner_id' => $owner->id,
                'name' => (string) ($animalPayload['name'] ?? 'Mascota'),
                'species' => (string) ($animalPayload['species'] ?? 'otro'),
                'breed' => $animalPayload['breed'] ?? null,
                'sex' => AnimalSex::normalize($animalPayload['sex'] ?? null),
                'is_sterilized' => array_key_exists('is_sterilized', $animalPayload)
                    ? filter_var($animalPayload['is_sterilized'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE)
                    : null,
                'color' => $animalPayload['color'] ?? null,
                'birth_date' => $animalPayload['birth_date'] ?? null,
                'notes' => $animalPayload['notes'] ?? null,
                'photo_path' => $this->storeAnimalPhotoFromPayload($animalPayload),
            ]);

            $registration = ChipRegistration::query()->create([
                'microchip' => $microchip,
                'public_code' => ChipRegistration::makePublicCode(),
                'animal_id' => $animal->id,
                'organization_id' => $org->id,
                'registered_by_user_id' => null,
                'status' => ChipRegistration::STATUS_PENDING_PAYMENT,
                'registered_at' => null,
                'implant_date' => $payload['implant_date'] ?? null,
                'implant_site' => $payload['implant_site'] ?? null,
                'certificate_code' => ChipRegistration::makeCertificateCode(),
                'country_code' => (string) ($payload['country_code'] ?? 'PE'),
                'vetsaas_tenant_id' => $tenantId,
                'vetsaas_paciente_id' => $pacienteId,
            ]);

            if ($markToken !== null) {
                $this->tokens->markUsed($markToken);
            }

            return $registration;
        });

        $fresh = $registration->fresh(['animal.owner', 'organization']) ?? $registration;
        $this->webhooks->dispatchPending($fresh);

        return [
            'registration' => $fresh,
            'activate_url' => $this->activateUrl($fresh),
            'pricing' => $pricing,
        ];
    }

    public function activateUrl(ChipRegistration $registration): string
    {
        return url('/activar/'.$registration->public_code);
    }

    /**
     * Activa el registro tras pago Culqi y notifica a VetSaaS.
     */
    public function activateAfterPayment(RegistrationPayment $payment): ChipRegistration
    {
        $payment->loadMissing('chipRegistration');

        $registration = $payment->chipRegistration;
        if ($registration === null) {
            throw ValidationException::withMessages([
                'payment' => 'El pago no está vinculado a un registro.',
            ]);
        }

        if ($registration->isActive()) {
            return $registration;
        }

        if (! $registration->isPendingPayment()) {
            throw ValidationException::withMessages([
                'payment' => 'El registro no está pendiente de pago.',
            ]);
        }

        $registration->update([
            'status' => ChipRegistration::STATUS_ACTIVE,
            'registered_at' => now(),
        ]);

        $fresh = $registration->fresh(['animal.owner', 'organization']) ?? $registration;
        $this->webhooks->dispatchRegistered($fresh);

        return $fresh;
    }

    private function resolveRegistrationPlan(): Plan
    {
        $plan = Plan::query()
            ->where('active', true)
            ->where('billing_period', Plan::PERIOD_REGISTRATION)
            ->orderByDesc('is_default')
            ->orderBy('sort_order')
            ->first();

        if ($plan === null) {
            throw ValidationException::withMessages([
                'plan' => 'No hay un plan de registro activo. Configúralo en el panel admin.',
            ]);
        }

        return $plan;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function resolveOrganization(array $payload): Organization
    {
        $tenantId = (string) ($payload['vetsaas_tenant_id'] ?? '');
        $slug = (string) ($payload['vetsaas_slug'] ?? '');
        $clinic = is_array($payload['clinic'] ?? null) ? $payload['clinic'] : [];

        $existing = Organization::query()
            ->where('vetsaas_tenant_id', $tenantId)
            ->first();

        if ($existing !== null) {
            $existing->forceFill([
                'name' => (string) ($clinic['name'] ?? $existing->name),
                'vetsaas_slug' => $slug !== '' ? $slug : $existing->vetsaas_slug,
                'contact_email' => $clinic['email'] ?? $existing->contact_email,
                'contact_phone' => $clinic['phone'] ?? $existing->contact_phone,
                'active' => true,
            ])->save();

            return $existing->fresh() ?? $existing;
        }

        $ruc = preg_replace('/\D+/', '', (string) ($clinic['ruc'] ?? '')) ?? '';
        if (strlen($ruc) !== 11 || Organization::query()->where('ruc', $ruc)->exists()) {
            $ruc = $this->syntheticRuc($tenantId);
        }

        return Organization::query()->create([
            'type' => 'clinic',
            'ruc' => $ruc,
            'name' => (string) ($clinic['name'] ?? 'Clínica VetSaaS'),
            'address' => $clinic['address'] ?? null,
            'city' => $clinic['city'] ?? null,
            'country_code' => (string) ($payload['country_code'] ?? 'PE'),
            'contact_email' => $clinic['email'] ?? null,
            'contact_phone' => $clinic['phone'] ?? null,
            'active' => true,
            'show_on_network' => false,
            'vetsaas_tenant_id' => $tenantId,
            'vetsaas_slug' => $slug !== '' ? $slug : null,
        ]);
    }

    /**
     * @param  array<string, mixed>  $owner
     */
    private function upsertOwner(array $owner, int $organizationId): Owner
    {
        $docType = $this->mapDocumentType($owner['document_type'] ?? null);
        $docNumber = preg_replace('/\s+/', '', (string) ($owner['document_number'] ?? '')) ?? '';

        if ($docNumber === '') {
            $docNumber = 'VS'.strtoupper(substr(hash('sha256', json_encode($owner) ?: Str::random(8)), 0, 10));
            $docType = DocumentType::Other->value;
        }

        $name = trim((string) ($owner['name'] ?? ''));
        $lastname = trim((string) ($owner['lastname'] ?? ''));

        if ($name === '' && filled($owner['full_name'] ?? null)) {
            $parts = preg_split('/\s+/', trim((string) $owner['full_name']), 2) ?: [];
            $name = $parts[0] ?? 'Titular';
            $lastname = $parts[1] ?? '';
        }

        if ($name === '') {
            $name = 'Titular';
        }

        $row = Owner::query()->firstOrNew([
            'document_type' => $docType,
            'document_number' => $docNumber,
        ]);

        $row->fill([
            'name' => $name,
            'lastname' => $lastname !== '' ? $lastname : '—',
            'email' => $owner['email'] ?? $row->email,
            'phone' => $owner['phone'] ?? $row->phone,
            'created_by_organization_id' => $row->created_by_organization_id ?? $organizationId,
        ]);
        $row->save();

        return $row->fresh() ?? $row;
    }

    /**
     * Actualiza la foto del animal vinculado a un paciente VetSaaS (activo o pendiente).
     *
     * @param  array<string, mixed>  $payload
     */
    public function syncAnimalPhoto(array $payload): ChipRegistration
    {
        $tenantId = (string) ($payload['vetsaas_tenant_id'] ?? '');
        $pacienteId = (string) ($payload['vetsaas_paciente_id'] ?? '');
        $publicCode = strtoupper(trim((string) ($payload['public_code'] ?? '')));

        $chip = null;
        if ($tenantId !== '' && $pacienteId !== '') {
            $chip = ChipRegistration::query()
                ->where('vetsaas_tenant_id', $tenantId)
                ->where('vetsaas_paciente_id', $pacienteId)
                ->with('animal')
                ->latest('id')
                ->first();
        }

        if ($chip === null && $publicCode !== '') {
            $chip = ChipRegistration::query()
                ->whereRaw('UPPER(public_code) = ?', [$publicCode])
                ->with('animal')
                ->latest('id')
                ->first();
        }

        if ($chip === null) {
            throw ValidationException::withMessages([
                'vetsaas_paciente_id' => 'No hay registro AlmaPet para este paciente.',
            ]);
        }

        // Completar vínculo VetSaaS si faltaba (registros antiguos).
        if ($tenantId !== '' && blank($chip->vetsaas_tenant_id)) {
            $chip->forceFill([
                'vetsaas_tenant_id' => $tenantId,
                'vetsaas_paciente_id' => $pacienteId !== '' ? $pacienteId : $chip->vetsaas_paciente_id,
            ])->save();
        }

        $animalPayload = is_array($payload['animal'] ?? null) ? $payload['animal'] : $payload;
        $this->applyAnimalPhotoFromPayload($chip->animal, $animalPayload);

        return $chip->fresh(['animal.owner', 'organization']) ?? $chip;
    }

    /**
     * @param  array<string, mixed>  $animalPayload
     */
    private function applyAnimalPhotoFromPayload(?Animal $animal, array $animalPayload): void
    {
        if ($animal === null) {
            return;
        }

        $path = $this->storeAnimalPhotoFromPayload($animalPayload);
        if ($path === null) {
            return;
        }

        if (filled($animal->photo_path) && $animal->photo_path !== $path) {
            Storage::disk('public')->delete($animal->photo_path);
        }

        $animal->forceFill(['photo_path' => $path])->save();
    }

    /**
     * @param  array<string, mixed>  $animalPayload
     */
    private function storeAnimalPhotoFromPayload(array $animalPayload): ?string
    {
        $base64 = (string) ($animalPayload['photo_base64'] ?? '');
        if ($base64 === '') {
            return null;
        }

        if (str_contains($base64, ',')) {
            $base64 = substr($base64, strpos($base64, ',') + 1) ?: '';
        }

        $binary = base64_decode($base64, true);
        if ($binary === false || strlen($binary) < 32) {
            return null;
        }

        // Límite ~2.5 MB decodificado
        if (strlen($binary) > 2_500_000) {
            return null;
        }

        $mime = strtolower(trim((string) ($animalPayload['photo_mime'] ?? 'image/jpeg')));
        $ext = match ($mime) {
            'image/png' => 'png',
            'image/webp' => 'webp',
            'image/gif' => 'gif',
            default => 'jpg',
        };

        $path = 'animals/'.Str::uuid()->toString().'.'.$ext;
        Storage::disk('public')->put($path, $binary);

        return $path;
    }

    private function mapDocumentType(mixed $raw): string
    {
        $value = strtolower(trim((string) $raw));

        return match ($value) {
            'dni', '1' => DocumentType::Dni->value,
            'pasaporte', 'passport' => DocumentType::Passport->value,
            'ce', 'carné', 'carne', 'foreign_id', 'extranjeria' => DocumentType::ForeignId->value,
            'ruc', 'national_id' => DocumentType::NationalId->value,
            default => DocumentType::Other->value,
        };
    }

    private function syntheticRuc(string $seed): string
    {
        $digits = preg_replace('/\D+/', '', hash('crc32b', $seed).hash('crc32b', $seed.'x')) ?? '00000000000';

        return '2'.substr(str_pad($digits, 10, '0'), 0, 10);
    }
}
