<?php

namespace App\Http\Requests\Clinic;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\Organization;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ClinicRegisterRequest extends FormRequest
{
    use PasswordValidationRules, ProfileValidationRules;

    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $ruc = preg_replace('/\D+/', '', (string) $this->input('ruc', '')) ?? '';

        $documentNumber = (string) $this->input('document_number', '');
        if ($this->input('document_type') === 'dni') {
            $documentNumber = preg_replace('/\D+/', '', $documentNumber) ?? '';
        }

        // El formulario usa "Teléfono de la clínica" (contact_phone); el perfil exige phone.
        $phone = preg_replace(
            '/\D+/',
            '',
            (string) ($this->input('phone') ?: $this->input('contact_phone', '')),
        ) ?? '';

        $this->merge([
            'ruc' => $ruc,
            'document_number' => $documentNumber,
            'phone' => $phone,
            'contact_phone' => $phone !== '' ? $phone : null,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'ruc' => [
                'required',
                'string',
                'regex:/^[0-9]{11}$/',
                Rule::unique(Organization::class, 'ruc'),
            ],
            'organization_name' => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'contact_phone' => ['nullable', 'string', 'regex:/^[0-9]{7,15}$/'],
            'distrito_id' => ['required', 'integer', Rule::exists('distritos', 'id')],
            'departamento_id' => ['nullable', 'integer', Rule::exists('departamentos', 'id')],
            'provincia_id' => ['nullable', 'integer', Rule::exists('provincias', 'id')],
            ...$this->profileRules(),
            'password' => $this->passwordRules(),
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'phone' => 'teléfono',
            'contact_phone' => 'teléfono de la clínica',
            'organization_name' => 'nombre de la veterinaria',
            'ruc' => 'RUC',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'ruc.regex' => __('El RUC debe tener exactamente 11 dígitos.'),
            'ruc.unique' => __('Ya existe una veterinaria registrada con este RUC.'),
            'phone.required' => __('El teléfono de la clínica es obligatorio.'),
            'phone.regex' => __('El teléfono debe tener solo números (7 a 15 dígitos).'),
        ];
    }
}