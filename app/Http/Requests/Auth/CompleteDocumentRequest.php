<?php

namespace App\Http\Requests\Auth;

use App\Concerns\ProfileValidationRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CompleteDocumentRequest extends FormRequest
{
    use ProfileValidationRules;

    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, array<int, ValidationRule|array<mixed>|string>>
     */
    public function rules(): array
    {
        return [
            'name' => $this->nameRules(),
            'lastname' => $this->lastnameRules(),
            'document_type' => $this->documentTypeRules(true),
            'document_number' => $this->documentNumberRules($this->user()?->id, true),
            'phone' => $this->phoneRules(true),
            'distrito_id' => ['required', 'integer', Rule::exists('distritos', 'id')],
            'departamento_id' => ['nullable', 'integer', Rule::exists('departamentos', 'id')],
            'provincia_id' => ['nullable', 'integer', Rule::exists('provincias', 'id')],
        ];
    }

    protected function prepareForValidation(): void
    {
        $merge = [
            'phone' => preg_replace('/\D+/', '', (string) $this->input('phone', '')) ?? '',
        ];

        if ($this->input('document_type') === 'dni') {
            $merge['document_number'] = preg_replace('/\D+/', '', (string) $this->input('document_number', '')) ?? '';
        }

        $this->merge($merge);
    }
}
