<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HandoffToken extends Model
{
    protected $fillable = [
        'token_hash',
        'payload',
        'expires_at',
        'used_at',
        'vetsaas_tenant_id',
        'vetsaas_paciente_id',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'expires_at' => 'datetime',
            'used_at' => 'datetime',
        ];
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function isUsed(): bool
    {
        return $this->used_at !== null;
    }

    public function isConsumable(): bool
    {
        return ! $this->isUsed() && ! $this->isExpired();
    }
}
