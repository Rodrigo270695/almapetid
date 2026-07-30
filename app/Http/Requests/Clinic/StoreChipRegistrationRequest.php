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

        $sterilized = data_get($this->all(), 'animal.is_sterilized');
        if ($sterilized === '' || $sterilized === null) {
            $sterilized = null;
        } elseif (in_array($sterilized, [true, 1, '1', 'true', 'yes', 'si', 'sí'], true)) {
            $sterilized = true;
        } elseif (in_array($sterilized, [false, 0, '0', 'false', 'no'], true)) {
            $sterilized = false;
        } else {
            $sterilized = null;
        }

        $this->merge([
            'owner' => array_merge((array) $this->input('owner', []), [
                'document_number' => $ownerDoc,
                'phone' => $ownerPhone,
            ]),
            'animal' => array_merge((array) $this->input('animal', []), [
                'is_sterilized' => $sterilized,
                'species_id' => data_get($this->all(), 'animal.species_id')
                    ? (int) data_get($this->all(), 'animal.species_id')
                    : null,
                'breed_id' => data_get($this->all(), 'animal.breed_id')
                    ? (int) data_get($this->all(), 'animal.breed_id')
                    : null,
            ]),
            'chip' => array_merge((array) $this->input('chip', []), [
                'microchip' => $microchip,
            ]),
            'include_physical' => filter_var(
                $this->input('include_physical', false),
                FILTER_VALIDATE_BOOLEAN,
            ),
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
            'animal.species_id' => ['required', 'integer', 'exists:species,id'],
            'animal.breed_id' => [
                'nullable',
                'integer',
                Rule::exists('breeds', 'id')->where(
                    fn ($q) => $q->where('species_id', (int) $this->input('animal.species_id')),
                ),
            ],
            'animal.sex' => ['nullable', 'string', Rule::in(['macho', 'hembra'])],
            'animal.is_sterilized' => ['nullable', 'boolean'],
            'animal.color' => ['nullable', 'string', 'max:80'],
            'animal.birth_date' => ['nullable', 'date'],
            'animal.notes' => ['nullable', 'string', 'max:2000'],

            'chip.microchip' => ['required', 'string', 'regex:/^[0-9]{15}$/', 'unique:chip_registrations,microchip'],
            'chip.implant_date' => ['nullable', 'date'],
            'chip.implant_site' => ['nullable', 'string', 'max:80'],

            'payment_mode' => ['required', 'string', Rule::in(['clinic_now', 'owner_whatsapp'])],
            'include_physical' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'owner.phone' => 'celular',
            'animal.name' => 'nombre de la mascota',
            'animal.species_id' => 'especie',
            'animal.breed_id' => 'raza',
            'animal.is_sterilized' => 'esterilización',
            'chip.microchip' => 'microchip',
            'payment_mode' => 'modo de pago',
            'include_physical' => 'carnet físico',
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
            'animal.species_id.required' => __('Selecciona la especie.'),
            'owner.phone.required' => __('El celular del propietario es obligatorio.'),
        ];
    }
}
