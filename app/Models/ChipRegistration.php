<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

class ChipRegistration extends Model
{
    public const STATUS_ACTIVE = 'active';

    public const STATUS_LOST = 'lost';

    protected $fillable = [
        'microchip',
        'public_code',
        'animal_id',
        'organization_id',
        'registered_by_user_id',
        'status',
        'registered_at',
        'implant_date',
        'implant_site',
        'certificate_code',
        'country_code',
        'vetsaas_tenant_id',
        'vetsaas_paciente_id',
    ];

    protected function casts(): array
    {
        return [
            'registered_at' => 'datetime',
            'implant_date' => 'date',
        ];
    }

    public function animal(): BelongsTo
    {
        return $this->belongsTo(Animal::class);
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function registeredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'registered_by_user_id');
    }

    public function lostReports(): HasMany
    {
        return $this->hasMany(LostReport::class, 'registration_id');
    }

    public function openLostReport(): HasOne
    {
        return $this->hasOne(LostReport::class, 'registration_id')
            ->ofMany(
                ['id' => 'max'],
                fn ($query) => $query->where('status', LostReport::STATUS_OPEN),
            );
    }

    public function foundReports(): HasMany
    {
        return $this->hasMany(FoundReport::class, 'registration_id');
    }

    public function isLost(): bool
    {
        return $this->status === self::STATUS_LOST;
    }

    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    public static function makePublicCode(): string
    {
        do {
            $code = strtoupper(Str::random(8));
        } while (self::query()->where('public_code', $code)->exists());

        return $code;
    }

    public static function makeCertificateCode(): string
    {
        do {
            $code = 'AP-'.strtoupper(Str::random(10));
        } while (self::query()->where('certificate_code', $code)->exists());

        return $code;
    }
}
