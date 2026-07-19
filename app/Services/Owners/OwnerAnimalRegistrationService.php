<?php

namespace App\Services\Owners;

use App\Models\Animal;
use App\Models\ChipRegistration;
use App\Models\Owner;
use App\Models\RegistrationPayment;
use App\Models\User;
use App\Services\Payments\RegistrationPaymentService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class OwnerAnimalRegistrationService
{
    public function __construct(
        private readonly OwnerClaimService $owners,
        private readonly RegistrationPaymentService $payments,
    ) {}

    public function ensureOwner(User $user): Owner
    {
        $owner = $this->owners->claimForUser($user);
        if ($owner !== null && (int) $owner->user_id === (int) $user->id) {
            return $owner;
        }

        if ($user->document_type === null || blank($user->document_number)) {
            throw ValidationException::withMessages([
                'document_number' => 'Completa tu documento antes de registrar una mascota.',
            ]);
        }

        if ($owner !== null && $owner->user_id !== null && (int) $owner->user_id !== (int) $user->id) {
            throw ValidationException::withMessages([
                'document_number' => 'Este documento ya está vinculado a otra cuenta.',
            ]);
        }

        return Owner::query()->updateOrCreate(
            [
                'document_type' => $user->document_type,
                'document_number' => $user->document_number,
            ],
            [
                'user_id' => $user->id,
                'name' => $user->name,
                'lastname' => $user->lastname,
                'email' => $user->email,
                'phone' => $user->phone,
            ],
        );
    }

    /**
     * @param  array{
     *     name: string,
     *     species: string,
     *     breed?: string|null,
     *     sex?: string|null,
     *     color?: string|null,
     *     birth_date?: string|null,
     *     notes?: string|null,
     *     photo_path?: string|null,
     *     microchip: string,
     *     implant_date?: string|null,
     *     implant_site?: string|null,
     * }  $data
     */
    public function registerWithPaidPayment(
        User $user,
        RegistrationPayment $payment,
        array $data,
    ): ChipRegistration {
        if ((int) $payment->user_id !== (int) $user->id) {
            throw ValidationException::withMessages([
                'payment_id' => 'Este pago no pertenece a tu cuenta.',
            ]);
        }

        if ($payment->status !== RegistrationPayment::STATUS_PAID) {
            throw ValidationException::withMessages([
                'payment_id' => 'Debes completar el pago antes de registrar la mascota.',
            ]);
        }

        if ($payment->chip_registration_id !== null) {
            throw ValidationException::withMessages([
                'payment_id' => 'Este pago ya fue usado para otra mascota.',
            ]);
        }

        $microchip = preg_replace('/\D+/', '', $data['microchip']) ?? '';
        if (strlen($microchip) < 9 || strlen($microchip) > 20) {
            throw ValidationException::withMessages([
                'microchip' => 'El microchip debe tener entre 9 y 20 dígitos (ISO suele ser 15).',
            ]);
        }

        if (ChipRegistration::query()->where('microchip', $microchip)->exists()) {
            throw ValidationException::withMessages([
                'microchip' => 'Este microchip ya está registrado.',
            ]);
        }

        $owner = $this->ensureOwner($user);

        return DB::transaction(function () use ($user, $payment, $data, $microchip, $owner): ChipRegistration {
            $lockedPayment = RegistrationPayment::query()
                ->whereKey($payment->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedPayment->chip_registration_id !== null
                || $lockedPayment->status !== RegistrationPayment::STATUS_PAID) {
                throw ValidationException::withMessages([
                    'payment_id' => 'Este pago ya no está disponible.',
                ]);
            }

            $animal = Animal::query()->create([
                'owner_id' => $owner->id,
                'name' => $data['name'],
                'species' => $data['species'],
                'breed' => $data['breed'] ?? null,
                'sex' => $data['sex'] ?? null,
                'color' => $data['color'] ?? null,
                'birth_date' => $data['birth_date'] ?? null,
                'notes' => $data['notes'] ?? null,
                'photo_path' => $data['photo_path'] ?? null,
            ]);

            $chip = ChipRegistration::query()->create([
                'microchip' => $microchip,
                'public_code' => ChipRegistration::makePublicCode(),
                'animal_id' => $animal->id,
                'organization_id' => null,
                'registered_by_user_id' => $user->id,
                'status' => 'active',
                'registered_at' => now(),
                'implant_date' => $data['implant_date'] ?? null,
                'implant_site' => $data['implant_site'] ?? null,
                'certificate_code' => ChipRegistration::makeCertificateCode(),
                'country_code' => 'PE',
            ]);

            $lockedPayment->update([
                'chip_registration_id' => $chip->id,
            ]);

            return $chip->fresh(['animal']);
        });
    }
}
