<?php

namespace App\Concerns;

use App\Enums\DocumentType;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rule;

trait ProfileValidationRules
{
    /**
     * @return array<string, array<int, ValidationRule|array<mixed>|string>>
     */
    protected function profileRules(?int $userId = null, bool $requireDocument = true): array
    {
        return [
            'name' => $this->nameRules(),
            'lastname' => $this->lastnameRules(),
            'document_type' => $this->documentTypeRules($requireDocument),
            'document_number' => $this->documentNumberRules($userId, $requireDocument),
            'email' => $this->emailRules($userId),
            'phone' => $this->phoneRules(),
        ];
    }

    /**
     * @return array<int, ValidationRule|array<mixed>|string>
     */
    protected function nameRules(): array
    {
        return ['required', 'string', 'max:120'];
    }

    /**
     * @return array<int, ValidationRule|array<mixed>|string>
     */
    protected function lastnameRules(): array
    {
        return ['required', 'string', 'max:120'];
    }

    /**
     * @return array<int, ValidationRule|array<mixed>|string>
     */
    protected function documentTypeRules(bool $required = true): array
    {
        return [
            $required ? 'required' : 'nullable',
            'string',
            Rule::enum(DocumentType::class),
        ];
    }

    /**
     * @return array<int, ValidationRule|array<mixed>|string>
     */
    protected function documentNumberRules(?int $userId = null, bool $required = true): array
    {
        $type = (string) request()->input('document_type', '');

        $rules = [
            $required ? 'required' : 'nullable',
            'string',
            'max:64',
        ];

        if ($type === DocumentType::Dni->value) {
            $rules[] = 'regex:/^[0-9]{8}$/';
        }

        $rules[] = Rule::unique(User::class, 'document_number')
            ->where(fn ($query) => $query->where('document_type', $type))
            ->ignore($userId);

        return $rules;
    }

    /**
     * @return array<int, ValidationRule|array<mixed>|string>
     */
    protected function emailRules(?int $userId = null): array
    {
        return [
            'required',
            'string',
            'email',
            'max:255',
            $userId === null
                ? Rule::unique(User::class)
                : Rule::unique(User::class)->ignore($userId),
        ];
    }

    /**
     * Celular de contacto (crítico para dueños / recuperación).
     *
     * @return array<int, ValidationRule|array<mixed>|string>
     */
    protected function phoneRules(bool $required = true): array
    {
        return [
            $required ? 'required' : 'nullable',
            'string',
            'regex:/^[0-9]{7,15}$/',
        ];
    }
}
