<?php

namespace App\Http\Requests\Clinic;

use App\Enums\DocumentType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreChipRegistrationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $ownerDoc = (string) data_get($this->all(), 'owner.document_number', '');
        if (data_get($this->all(), 'owner.document_type') === 'dni') {
            $ownerDoc = preg_replace('/\D+/', '', $ownerDoc) ?? '';
        }

        $microchip = preg_replace('/\D+/', '', (string) data_get($this->all(), 'chip.microchip', '')) ?? '';

        $ownerPhone = preg_replace('/\D+/', '', (string) data_get($this->all(), 'owner.phone', '')) ?? '';

        $this->merge([
            'owner' => array_merge((array) $this->input('owner', []), [
                'document_number' => $ownerDoc,
                'phone' => $ownerPhone,
            ]),
            'chip' => array_merge((array) $this->input('chip', []), [
                'microchip' => $microchip,
            ]),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'owner.document_type' => ['required', 'string', Rule::enum(DocumentType::class)],
            'owner.document_number' => [
                'required',
                'string',
                'max:64',
                Rule::when(
                    $this->input('owner.document_type') === DocumentType::Dni->value,
                    ['regex:/^[0-9]{8}$/'],
                ),
            ],
            'owner.name' => ['required', 'string', 'max:120'],
            'owner.lastname' => ['required', 'string', 'max:120'],
            'owner.email' => ['nullable', 'email', 'max:255'],
            'owner.phone' => ['required', 'string', 'regex:/^[0-9]{7,15}$/'],

            'animal.name' => ['required', 'string', 'max:120'],
            'animal.species' => ['required', 'string', 'max:40'],
            'animal.breed' => ['nullable', 'string', 'max:80'],
            'animal.sex' => ['nullable', 'string', 'max:20'],
            'animal.color' => ['nullable', 'string', 'max:80'],
            'animal.birth_date' => ['nullable', 'date'],
            'animal.notes' => ['nullable', 'string', 'max:2000'],

            'chip.microchip' => ['required', 'string', 'regex:/^[0-9]{15}$/', 'unique:chip_registrations,microchip'],
            'chip.implant_date' => ['nullable', 'date'],
            'chip.implant_site' => ['nullable', 'string', 'max:80'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'chip.microchip.regex' => __('El microchip debe tener exactamente 15 dígitos.'),
            'chip.microchip.unique' => __('Este microchip ya está registrado.'),
        ];
    }
}
