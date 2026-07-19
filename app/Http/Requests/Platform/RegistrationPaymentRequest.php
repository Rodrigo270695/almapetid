<?php

namespace App\Http\Requests\Platform;

use App\Models\RegistrationPayment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RegistrationPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $nullable = [
            'plan_id',
            'user_id',
            'organization_id',
            'chip_registration_id',
            'provider_reference',
            'notes',
            'paid_at',
        ];

        $merged = [];
        foreach ($nullable as $key) {
            if ($this->exists($key) && $this->input($key) === '') {
                $merged[$key] = null;
            }
        }

        if ($merged !== []) {
            $this->merge($merged);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'plan_id' => ['nullable', 'integer', 'exists:plans,id'],
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'organization_id' => ['nullable', 'integer', 'exists:organizations,id'],
            'chip_registration_id' => ['nullable', 'integer', 'exists:chip_registrations,id'],
            'amount' => ['required', 'numeric', 'min:0.01', 'max:999999.99'],
            'currency' => ['required', Rule::in(['PEN', 'USD'])],
            'status' => [
                'required',
                Rule::in([
                    RegistrationPayment::STATUS_PENDING,
                    RegistrationPayment::STATUS_PAID,
                    RegistrationPayment::STATUS_FAILED,
                    RegistrationPayment::STATUS_REFUNDED,
                ]),
            ],
            'provider' => [
                'required',
                Rule::in([
                    RegistrationPayment::PROVIDER_MANUAL,
                    RegistrationPayment::PROVIDER_CULQI,
                    RegistrationPayment::PROVIDER_NIUBIZ,
                    RegistrationPayment::PROVIDER_STRIPE,
                ]),
            ],
            'provider_reference' => ['nullable', 'string', 'max:120'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'paid_at' => ['nullable', 'date'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'plan_id' => 'plan',
            'user_id' => 'usuario',
            'organization_id' => 'organización',
            'chip_registration_id' => 'registro',
            'amount' => 'monto',
            'currency' => 'moneda',
            'status' => 'estado',
            'provider' => 'proveedor',
            'provider_reference' => 'referencia',
            'notes' => 'notas',
            'paid_at' => 'fecha de pago',
        ];
    }
}
