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
use App\Services\Payments\RegistrationPaymentService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class HandoffRegistrationService
{
    public function __construct(
        private readonly VetSaasWebhookDispatcher $webhooks,
        private readonly HandoffTokenService $tokens,
        private readonly RegistrationPaymentService $payments,
    ) {}

    /**
     * Confirma el handoff: crea org + owner + animal + chip pending_payment
     * y un pago Culqi con canal VetSaaS.
     *
     * @return array{registration: ChipRegistration, payment: RegistrationPayment, pricing: array{channel: string, amount: float, platform_amount: float, clinic_commission: float, currency: string}}
     */
    public function confirm(HandoffToken $token): array
    {
        if (! $token->isConsumable()) {
            throw ValidationException::withMessages([
                'token' => 'Este enlace ya no es válido.',
            ]);
        }

        $payload = $token->payload;
        $microchip = preg_replace('/\D+/', '', (string) ($payload['microchip'] ?? '')) ?? '';

        if (ChipRegistration::query()->where('microchip', $microchip)->exists()) {
            throw ValidationException::withMessages([
                'microchip' => 'Este microchip ya está registrado en AlmaPet ID.',
            ]);
        }

        $tenantId = (string) ($payload['vetsaas_tenant_id'] ?? '');
        $pacienteId = (string) ($payload['vetsaas_paciente_id'] ?? '');

        if (
            ChipRegistration::query()
                ->where('vetsaas_tenant_id', $tenantId)
                ->where('vetsaas_paciente_id', $pacienteId)
                ->exists()
        ) {
            throw ValidationException::withMessages([
                'paciente' => 'Este paciente ya tiene un registro AlmaPet vinculado.',
            ]);
        }

        $plan = $this->resolveRegistrationPlan();
        $pricing = $plan->pricingFor(Plan::CHANNEL_VETSAAS);

        $result = DB::transaction(function () use ($token, $payload, $microchip, $tenantId, $pacienteId, $plan, $pricing): array {
            $org = $this->resolveOrganization($payload);
            $owner = $this->upsertOwner($payload['owner'] ?? [], $org->id);

            $animalPayload = is_array($payload['animal'] ?? null) ? $payload['animal'] : [];

            $animal = Animal::query()->create([
                'owner_id' => $owner->id,
                'name' => (string) ($animalPayload['name'] ?? 'Mascota'),
                'species' => (string) ($animalPayload['species'] ?? 'otro'),
                'breed' => $animalPayload['breed'] ?? null,
                'sex' => $this->mapSex($animalPayload['sex'] ?? null),
                'color' => $animalPayload['color'] ?? null,
                'birth_date' => $animalPayload['birth_date'] ?? null,
                'notes' => $animalPayload['notes'] ?? null,
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

            $guestEmail = $this->guestEmail($owner, $payload);

            $payment = $this->payments->createHandoffCulqiPayment(
                $plan,
                $registration,
                $org,
                $guestEmail,
                Plan::CHANNEL_VETSAAS,
            );

            $this->tokens->markUsed($token);

            return [
                'registration' => $registration,
                'payment' => $payment,
                'pricing' => $pricing,
            ];
        });

        return $result;
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
    private function guestEmail(Owner $owner, array $payload): string
    {
        if (filled($owner->email)) {
            return (string) $owner->email;
        }

        $clinicEmail = $payload['clinic']['email'] ?? null;
        if (filled($clinicEmail)) {
            return (string) $clinicEmail;
        }

        return 'handoff+'.$owner->id.'@almapetid.com';
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

    private function mapSex(mixed $raw): ?string
    {
        $value = strtoupper(trim((string) $raw));

        return match ($value) {
            'M', 'MACHO', 'MALE' => 'M',
            'H', 'F', 'HEMBRA', 'FEMALE' => 'H',
            'U', 'UNKNOWN', 'I' => 'U',
            default => null,
        };
    }

    private function syntheticRuc(string $seed): string
    {
        $digits = preg_replace('/\D+/', '', hash('crc32b', $seed).hash('crc32b', $seed.'x')) ?? '00000000000';

        return '2'.substr(str_pad($digits, 10, '0'), 0, 10);
    }
}
