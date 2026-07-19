<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RegistrationPayment extends Model
{
    public const STATUS_PENDING = 'pending';

    public const STATUS_PAID = 'paid';

    public const STATUS_FAILED = 'failed';

    public const STATUS_REFUNDED = 'refunded';

    public const PROVIDER_MANUAL = 'manual';

    public const PROVIDER_CULQI = 'culqi';

    public const PROVIDER_NIUBIZ = 'niubiz';

    public const PROVIDER_STRIPE = 'stripe';

    protected $fillable = [
        'plan_id',
        'chip_registration_id',
        'user_id',
        'organization_id',
        'amount',
        'currency',
        'channel',
        'platform_amount',
        'clinic_commission',
        'status',
        'provider',
        'provider_reference',
        'paid_at',
        'notes',
        'created_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'platform_amount' => 'decimal:2',
            'clinic_commission' => 'decimal:2',
            'paid_at' => 'datetime',
        ];
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function chipRegistration(): BelongsTo
    {
        return $this->belongsTo(ChipRegistration::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }
}
