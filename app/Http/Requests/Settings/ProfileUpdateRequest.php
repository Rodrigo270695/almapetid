<?php

namespace App\Http\Requests\Settings;

use App\Concerns\ProfileValidationRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ProfileUpdateRequest extends FormRequest
{
    use ProfileValidationRules;

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return $this->profileRules($this->user()?->id);
    }

    protected function prepareForValidation(): void
    {
        $merge = [
            'phone' => preg_replace('/\D+/', '', (string) $this->input('phone', '')) ?? '',
        ];

        if ($this->input('document_type') === 'dni') {
            $merge['document_number'] = preg_replace(
                '/\D+/',
                '',
                (string) $this->input('document_number', ''),
            ) ?? '';
        }

        $this->merge($merge);
    }
}
