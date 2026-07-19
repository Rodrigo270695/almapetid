<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Plan extends Model
{
    public const PERIOD_REGISTRATION = 'registration';

    public const PERIOD_ANNUAL = 'annual';

    protected $fillable = [
        'code',
        'name',
        'description',
        'billing_period',
        'duration_months',
        'amount',
        'currency',
        'active',
        'is_default',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'active' => 'boolean',
            'is_default' => 'boolean',
            'duration_months' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    public function payments(): HasMany
    {
        return $this->hasMany(RegistrationPayment::class);
    }

    public function isAnnual(): bool
    {
        return $this->billing_period === self::PERIOD_ANNUAL;
    }

    /**
     * Catálogo público de planes activos (landing / precios).
     *
     * @return list<array{
     *     id: int,
     *     code: string,
     *     name: string,
     *     description: string|null,
     *     billing_period: string,
     *     duration_months: int|null,
     *     amount: float,
     *     currency: string,
     *     is_default: bool
     * }>
     */
    public static function publicCatalog(): array
    {
        return static::query()
            ->where('active', true)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get([
                'id',
                'code',
                'name',
                'description',
                'billing_period',
                'duration_months',
                'amount',
                'currency',
                'is_default',
            ])
            ->map(fn (self $plan) => [
                'id' => $plan->id,
                'code' => $plan->code,
                'name' => $plan->name,
                'description' => $plan->description,
                'billing_period' => $plan->billing_period,
                'duration_months' => $plan->duration_months,
                'amount' => (float) $plan->amount,
                'currency' => $plan->currency,
                'is_default' => (bool) $plan->is_default,
            ])
            ->values()
            ->all();
    }
}
