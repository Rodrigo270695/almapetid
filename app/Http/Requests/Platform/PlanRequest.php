<?php

namespace App\Http\Requests\Platform;

use App\Models\Plan;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PlanRequest extends FormRequest
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
        $planId = $this->route('plan')?->id;

        return [
            'code' => [
                'required',
                'string',
                'max:64',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('plans', 'code')->ignore($planId),
            ],
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:255'],
            'billing_period' => [
                'required',
                Rule::in([Plan::PERIOD_REGISTRATION, Plan::PERIOD_ANNUAL]),
            ],
            'duration_months' => [
                'nullable',
                'integer',
                'min:1',
                'max:120',
                Rule::requiredIf(fn () => $this->input('billing_period') === Plan::PERIOD_ANNUAL),
            ],
            'amount' => ['required', 'numeric', 'min:0.01', 'max:999999.99'],
            'currency' => ['required', Rule::in(['PEN', 'USD'])],
            'active' => ['sometimes', 'boolean'],
            'is_default' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'code' => 'código',
            'name' => 'nombre',
            'description' => 'descripción',
            'billing_period' => 'periodo',
            'duration_months' => 'duración (meses)',
            'amount' => 'monto',
            'currency' => 'moneda',
            'active' => 'activo',
            'is_default' => 'predeterminado',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('code')) {
            $this->merge([
                'code' => strtolower(trim((string) $this->input('code'))),
            ]);
        }

        if ($this->input('billing_period') === Plan::PERIOD_REGISTRATION) {
            $this->merge(['duration_months' => null]);
        } elseif ($this->input('billing_period') === Plan::PERIOD_ANNUAL && ! $this->filled('duration_months')) {
            $this->merge(['duration_months' => 12]);
        }
    }
}
