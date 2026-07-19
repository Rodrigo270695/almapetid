<?php

namespace App\Http\Requests\Clinic;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOrganizationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:180'],
            'address' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:120'],
            'country_code' => ['required', 'string', 'size:2'],
            'contact_email' => ['nullable', 'email', 'max:255'],
            'contact_phone' => ['nullable', 'string', 'regex:/^[0-9]{7,15}$/'],
            'logo' => ['nullable', 'image', 'max:2048'],
            'show_on_network' => ['sometimes', 'boolean'],
        ];
    }

    public function attributes(): array
    {
        return [
            'name' => 'nombre',
            'address' => 'dirección',
            'city' => 'ciudad',
            'country_code' => 'país',
            'contact_email' => 'correo de contacto',
            'contact_phone' => 'teléfono de contacto',
        ];
    }

    protected function prepareForValidation(): void
    {
        $phone = $this->input('contact_phone');
        $this->merge([
            'name' => trim((string) $this->input('name', '')),
            'address' => trim((string) $this->input('address', '')) ?: null,
            'city' => trim((string) $this->input('city', '')) ?: null,
            'country_code' => strtoupper(trim((string) $this->input('country_code', 'PE'))),
            'contact_email' => strtolower(trim((string) $this->input('contact_email', ''))) ?: null,
            'contact_phone' => $phone !== null && $phone !== ''
                ? (preg_replace('/\D+/', '', (string) $phone) ?? '')
                : null,
            'show_on_network' => $this->boolean('show_on_network'),
        ]);
    }
}
