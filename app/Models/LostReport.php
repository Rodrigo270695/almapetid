<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LostReport extends Model
{
    public const STATUS_OPEN = 'open';

    public const STATUS_RECOVERED = 'recovered';

    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'registration_id',
        'status',
        'lost_at',
        'distrito_id',
        'departamento',
        'provincia',
        'distrito',
        'last_seen_zone',
        'last_seen_city',
        'last_seen_lat',
        'last_seen_lng',
        'public_notes',
        'photo_path',
        'declared_by_user_id',
        'recovered_at',
    ];

    protected function casts(): array
    {
        return [
            'lost_at' => 'datetime',
            'recovered_at' => 'datetime',
            'last_seen_lat' => 'float',
            'last_seen_lng' => 'float',
            'distrito_id' => 'integer',
        ];
    }

    public function photoUrl(): ?string
    {
        if (blank($this->photo_path)) {
            return null;
        }

        return asset('storage/'.$this->photo_path);
    }

    public function registration(): BelongsTo
    {
        return $this->belongsTo(ChipRegistration::class, 'registration_id');
    }

    public function distritoModel(): BelongsTo
    {
        return $this->belongsTo(Distrito::class, 'distrito_id');
    }

    public function declaredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'declared_by_user_id');
    }

    public function foundReports(): HasMany
    {
        return $this->hasMany(FoundReport::class);
    }

    public function isOpen(): bool
    {
        return $this->status === self::STATUS_OPEN;
    }
}
