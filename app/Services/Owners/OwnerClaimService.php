<?php

namespace App\Services\Owners;

use App\Enums\DocumentType;
use App\Models\Owner;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final class OwnerClaimService
{
    /**
     * Vincula perfiles Owner pendientes al user por documento.
     */
    public function claimForUser(User $user): ?Owner
    {
        if ($user->document_type === null || blank($user->document_number)) {
            return null;
        }

        return DB::transaction(function () use ($user): ?Owner {
            $owner = Owner::query()
                ->where('document_type', $user->document_type)
                ->where('document_number', $user->document_number)
                ->lockForUpdate()
                ->first();

            if ($owner === null) {
                return null;
            }

            if ($owner->user_id !== null && $owner->user_id !== $user->id) {
                return $owner;
            }

            $owner->forceFill([
                'user_id' => $user->id,
                'email' => $owner->email ?: $user->email,
                'phone' => $user->phone ?: $owner->phone,
                'name' => $user->name ?: $owner->name,
                'lastname' => $user->lastname ?: $owner->lastname,
            ])->save();

            // Si la clínica ya tenía teléfono y el user aún no, copiarlo.
            if (blank($user->phone) && filled($owner->phone)) {
                $user->forceFill(['phone' => $owner->phone])->save();
            }

            return $owner->fresh();
        });
    }

    /**
     * Vincula o crea el perfil Owner del usuario (registro público).
     *
     * @param  array{
     *     distrito_id?: int,
     *     distrito?: string,
     *     provincia?: string|null,
     *     departamento?: string|null,
     *     city?: string,
     * }  $location
     */
    public function ensureOwnerForUser(User $user, array $location = []): Owner
    {
        $owner = $this->claimForUser($user);

        if ($owner === null) {
            $owner = Owner::query()->create([
                'document_type' => $user->document_type,
                'document_number' => $user->document_number,
                'name' => $user->name,
                'lastname' => $user->lastname,
                'email' => $user->email,
                'phone' => $user->phone,
                'user_id' => $user->id,
                'distrito_id' => $location['distrito_id'] ?? null,
                'departamento' => $location['departamento'] ?? null,
                'provincia' => $location['provincia'] ?? null,
                'distrito' => $location['distrito'] ?? null,
            ]);

            return $owner->fresh() ?? $owner;
        }

        if (($location['distrito_id'] ?? null) !== null) {
            $owner->forceFill([
                'distrito_id' => $location['distrito_id'],
                'departamento' => $location['departamento'] ?? $owner->departamento,
                'provincia' => $location['provincia'] ?? $owner->provincia,
                'distrito' => $location['distrito'] ?? $owner->distrito,
            ])->save();
        }

        return $owner->fresh() ?? $owner;
    }

    /**
     * Crea o actualiza un Owner desde datos de clínica.
     *
     * @param  array{
     *     document_type: string|DocumentType,
     *     document_number: string,
     *     name: string,
     *     lastname: string,
     *     email?: string|null,
     *     phone?: string|null,
     * }  $data
     */
    public function upsertFromClinic(
        array $data,
        int $organizationId,
        int $createdByUserId,
    ): Owner {
        $type = $data['document_type'] instanceof DocumentType
            ? $data['document_type']->value
            : (string) $data['document_type'];

        $number = (string) $data['document_number'];

        $owner = Owner::query()->firstOrNew([
            'document_type' => $type,
            'document_number' => $number,
        ]);

        $owner->fill([
            'name' => $data['name'],
            'lastname' => $data['lastname'],
            'email' => $data['email'] ?? $owner->email,
            'phone' => $data['phone'] ?? $owner->phone,
            'created_by_organization_id' => $owner->created_by_organization_id ?? $organizationId,
            'created_by_user_id' => $owner->created_by_user_id ?? $createdByUserId,
        ]);

        // Si ya hay user con ese documento, vincular.
        if ($owner->user_id === null) {
            $existingUser = User::query()
                ->where('document_type', $type)
                ->where('document_number', $number)
                ->first();

            if ($existingUser !== null) {
                $owner->user_id = $existingUser->id;

                if (blank($existingUser->phone) && filled($data['phone'] ?? null)) {
                    $existingUser->forceFill(['phone' => $data['phone']])->save();
                }
            }
        }

        $owner->save();

        return $owner->fresh();
    }
}
