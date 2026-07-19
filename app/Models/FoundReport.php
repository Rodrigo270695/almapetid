<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FoundReport extends Model
{
    protected $fillable = [
        'registration_id',
        'lost_report_id',
        'reporter_name',
        'reporter_phone',
        'reporter_email',
        'message',
        'city',
        'zone',
        'notified_owner_at',
    ];

    protected function casts(): array
    {
        return [
            'notified_owner_at' => 'datetime',
        ];
    }

    public function registration(): BelongsTo
    {
        return $this->belongsTo(ChipRegistration::class, 'registration_id');
    }

    public function lostReport(): BelongsTo
    {
        return $this->belongsTo(LostReport::class);
    }
}
