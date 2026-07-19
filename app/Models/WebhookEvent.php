<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WebhookEvent extends Model
{
    protected $fillable = [
        'gateway',
        'gateway_event_id',
        'event_type',
        'payload',
        'processed',
        'attempts',
        'last_error',
        'processed_at',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'processed' => 'boolean',
            'attempts' => 'integer',
            'processed_at' => 'datetime',
        ];
    }

    public function markProcessed(): void
    {
        $this->forceFill([
            'processed' => true,
            'processed_at' => now(),
            'attempts' => $this->attempts + 1,
            'last_error' => null,
        ])->save();
    }

    public function markFailed(string $message): void
    {
        $this->forceFill([
            'processed' => false,
            'attempts' => $this->attempts + 1,
            'last_error' => mb_substr($message, 0, 1000),
        ])->save();
    }
}
