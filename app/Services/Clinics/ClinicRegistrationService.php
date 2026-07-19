<?php

namespace App\Services\Clinics;

use App\Models\Animal;
use App\Models\ChipRegistration;
use App\Models\Organization;
use App\Models\User;
use App\Services\Owners\OwnerClaimService;
use App\Support\Auth\Roles;
use App\Support\Geo\GeoDefaults;
use App\Support\Geo\LocationHydrator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class ClinicRegistrationService
{
    public function __construct(
        private readonly OwnerClaimService $owners,
    ) {}

    /**
     * @param  array{
     *     ruc: string,
     *     organization_name: string,
     *     address?: string|null,
     *     contact_email?: string|null,
     *     contact_phone?: string|null,
     *     distrito_id: int,
     *     name: string,
     *     lastname: string,
     *     document_type: string,
     *     document_number: string,
     *     email: string,
     *     password: string,
     * }  $data
     */
    public function register(array $data): User
    {
        $ruc = preg_replace('/\D+/', '', $data['ruc']) ?? '';

        if (Organization::query()->where('ruc', $ruc)->exists()) {
            throw ValidationException::withMessages([
                'ruc' => __('Ya existe una veterinaria registrada con este RUC.'),
            ]);
        }

        $location = LocationHydrator::fromDistritoId((int) $data['distrito_id']);
        if ($location === null) {
            throw ValidationException::withMessages([
                'distrito_id' => __('Distrito no válido.'),
            ]);
        }

        return DB::transaction(function () use ($data, $ruc, $location): User {
            $org = Organization::query()->create([
                'type' => 'clinic',
                'ruc' => $ruc,
                'name' => $data['organization_name'],
                'address' => $data['address'] ?? null,
                'city' => $location['city'],
                'distrito_id' => $location['distrito_id'],
                'departamento' => $location['departamento'],
                'provincia' => $location['provincia'],
                'distrito' => $location['distrito'],
                'contact_email' => $data['contact_email'] ?? $data['email'],
                'contact_phone' => $data['contact_phone'] ?? null,
                'country_code' => GeoDefaults::PAIS_CODE,
                'active' => true,
            ]);

            $user = User::query()->create([
                'name' => $data['name'],
                'lastname' => $data['lastname'],
                'document_type' => $data['document_type'],
                'document_number' => $data['document_number'],
                'email' => $data['email'],
                'password' => $data['password'],
                'email_verified_at' => now(),
            ]);

            $user->assignRole(Roles::ORG_ADMIN);
            $org->users()->attach($user->id, ['role' => Roles::ORG_ADMIN]);

            return $user;
        });
    }

    /**
     * @param  array{
     *     owner: array{
     *         document_type: string,
     *         document_number: string,
     *         name: string,
     *         lastname: string,
     *         email?: string|null,
     *         phone?: string|null,
     *     },
     *     animal: array{
     *         name: string,
     *         species: string,
     *         breed?: string|null,
     *         sex?: string|null,
     *         color?: string|null,
     *         birth_date?: string|null,
     *         notes?: string|null,
     *     },
     *     chip: array{
     *         microchip: string,
     *         implant_date?: string|null,
     *         implant_site?: string|null,
     *     },
     * }  $data
     */
    public function registerOwnerAnimalChip(
        User $staff,
        Organization $organization,
        array $data,
    ): ChipRegistration {
        $microchip = preg_replace('/\D+/', '', $data['chip']['microchip']) ?? '';

        if (ChipRegistration::query()->where('microchip', $microchip)->exists()) {
            throw ValidationException::withMessages([
                'chip.microchip' => __('Este microchip ya está registrado.'),
            ]);
        }

        return DB::transaction(function () use ($staff, $organization, $data, $microchip): ChipRegistration {
            $owner = $this->owners->upsertFromClinic(
                $data['owner'],
                $organization->id,
                $staff->id,
            );

            $animal = Animal::query()->create([
                'owner_id' => $owner->id,
                'name' => $data['animal']['name'],
                'species' => $data['animal']['species'],
                'breed' => $data['animal']['breed'] ?? null,
                'sex' => $data['animal']['sex'] ?? null,
                'color' => $data['animal']['color'] ?? null,
                'birth_date' => $data['animal']['birth_date'] ?? null,
                'notes' => $data['animal']['notes'] ?? null,
            ]);

            return ChipRegistration::query()->create([
                'microchip' => $microchip,
                'public_code' => ChipRegistration::makePublicCode(),
                'animal_id' => $animal->id,
                'organization_id' => $organization->id,
                'registered_by_user_id' => $staff->id,
                'status' => 'active',
                'registered_at' => now(),
                'implant_date' => $data['chip']['implant_date'] ?? null,
                'implant_site' => $data['chip']['implant_site'] ?? null,
                'certificate_code' => ChipRegistration::makeCertificateCode(),
                'country_code' => 'PE',
            ]);
        });
    }
}
