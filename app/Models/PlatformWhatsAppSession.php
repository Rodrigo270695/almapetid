<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlatformWhatsAppSession extends Model
{
    public const STATUS_READY = 'ready';

    protected $table = 'platform_whatsapp_sessions';

    protected $fillable = [
        'openwa_session_id',
        'openwa_session_name',
        'status',
        'phone',
        'push_name',
        'connected_at',
        'last_synced_at',
        'last_error',
    ];

    protected function casts(): array
    {
        return [
            'connected_at' => 'datetime',
            'last_synced_at' => 'datetime',
        ];
    }

    public function isReady(): bool
    {
        return $this->status === self::STATUS_READY;
    }
}
