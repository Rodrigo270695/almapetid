<?php

namespace App\Http\Requests;

use App\Enums\DocumentType;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

/**
 * Validación unificada para crear y editar usuarios (panel plataforma).
 */
class UserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        /** @var User|null $user */
        $user = $this->route('user');
        $userId = $user?->getKey();
        $isCreate = $userId === null;

        return [
            'name' => ['required', 'string', 'max:80'],
            'lastname' => ['required', 'string', 'max:80'],
            'email' => [
                'required',
                'string',
                'email:rfc,dns',
                'max:150',
                Rule::unique('users', 'email')->ignore($userId),
            ],
            'document_type' => ['nullable', Rule::enum(DocumentType::class)],
            'document_number' => ['nullable', 'string', 'max:32'],
            'phone' => ['required', 'string', 'regex:/^[0-9]{7,15}$/'],
            'password' => array_values(array_filter([
                $isCreate ? 'required' : 'nullable',
                'string',
                $isCreate || filled($this->input('password'))
                    ? Password::defaults()
                    : null,
                'confirmed',
            ])),
            'role' => [
                'required',
                'string',
                Rule::exists(config('permission.table_names.roles'), 'name')
                    ->where('guard_name', 'web'),
            ],
        ];
    }

    public function attributes(): array
    {
        return [
            'name' => 'nombres',
            'lastname' => 'apellidos',
            'email' => 'correo electrónico',
            'document_type' => 'tipo de documento',
            'document_number' => 'número de documento',
            'phone' => 'celular',
            'password' => 'contraseña',
            'role' => 'rol',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'name' => trim((string) $this->input('name', '')),
            'lastname' => trim((string) $this->input('lastname', '')),
            'email' => strtolower(trim((string) $this->input('email', ''))),
            'document_number' => trim((string) $this->input('document_number', '')) ?: null,
            'document_type' => $this->input('document_type') ?: null,
            'phone' => preg_replace('/\D+/', '', (string) $this->input('phone', '')) ?? '',
        ]);
    }
}
