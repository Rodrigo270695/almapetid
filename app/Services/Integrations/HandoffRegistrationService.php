<?php

namespace App\Services\Integrations;

use App\Enums\DocumentType;
use App\Models\Animal;
use App\Models\ChipRegistration;
use App\Models\HandoffToken;
use App\Models\Organization;
use App\Models\Owner;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class HandoffRegistrationService
{
    public function __construct(
        private readonly VetSaasWebhookDispatcher $webhooks,
        private readonly HandoffTokenService $tokens,
    ) {}

    /**
     * Confirma el handoff: crea/upsert org + owner + animal + chip activo
     * y notifica a VetSaaS.
     */
    public function confirm(HandoffToken $token): ChipRegistration
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

        $registration = DB::transaction(function () use ($token, $payload, $microchip, $tenantId, $pacienteId): ChipRegistration {
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
                'status' => ChipRegistration::STATUS_ACTIVE,
                'registered_at' => now(),
                'implant_date' => $payload['implant_date'] ?? null,
                'implant_site' => $payload['implant_site'] ?? null,
                'certificate_code' => ChipRegistration::makeCertificateCode(),
                'country_code' => (string) ($payload['country_code'] ?? 'PE'),
                'vetsaas_tenant_id' => $tenantId,
                'vetsaas_paciente_id' => $pacienteId,
            ]);

            $this->tokens->markUsed($token);

            return $registration;
        });

        $this->webhooks->dispatchRegistered($registration->fresh(['animal.owner', 'organization']) ?? $registration);

        return $registration;
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
