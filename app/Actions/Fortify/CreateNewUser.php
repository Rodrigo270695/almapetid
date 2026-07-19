<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\User;
use App\Services\Owners\OwnerClaimService;
use App\Support\Auth\Roles;
use App\Support\Geo\LocationHydrator;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    public function __construct(
        private readonly OwnerClaimService $claim,
    ) {}

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, mixed>  $input
     */
    public function create(array $input): User
    {
        if (($input['document_type'] ?? null) === 'dni') {
            $input['document_number'] = preg_replace(
                '/\D+/',
                '',
                (string) ($input['document_number'] ?? ''),
            ) ?? '';
        }

        $input['phone'] = preg_replace('/\D+/', '', (string) ($input['phone'] ?? '')) ?? '';

        Validator::make($input, [
            ...$this->profileRules(),
            'password' => $this->passwordRules(),
            'distrito_id' => ['required', 'integer', Rule::exists('distritos', 'id')],
            'departamento_id' => ['nullable', 'integer', Rule::exists('departamentos', 'id')],
            'provincia_id' => ['nullable', 'integer', Rule::exists('provincias', 'id')],
        ])->validate();

        $location = LocationHydrator::fromDistritoId((int) $input['distrito_id']);
        if ($location === null) {
            throw ValidationException::withMessages([
                'distrito_id' => __('Distrito no válido.'),
            ]);
        }

        $user = User::create([
            'name' => $input['name'],
            'lastname' => $input['lastname'],
            'document_type' => $input['document_type'],
            'document_number' => $input['document_number'],
            'email' => $input['email'],
            'phone' => $input['phone'],
            'password' => $input['password'],
        ]);

        $user->assignRole(Roles::OWNER);

        $this->claim->ensureOwnerForUser($user, $location);

        return $user;
    }
}
