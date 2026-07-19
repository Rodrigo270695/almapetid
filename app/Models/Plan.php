<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use InvalidArgumentException;

class Plan extends Model
{
    public const PERIOD_REGISTRATION = 'registration';

    public const PERIOD_ANNUAL = 'annual';

    /** Dueño paga en AlmaPet sin clínica intermediaria. */
    public const CHANNEL_DIRECT = 'direct';

    /** Alta desde tenant VetSaaS (convenio). */
    public const CHANNEL_VETSAAS = 'vetsaas';

    /** Clínica partner fuera de VetSaaS. */
    public const CHANNEL_PARTNER = 'partner';

    protected $fillable = [
        'code',
        'name',
        'description',
        'billing_period',
        'duration_months',
        'amount',
        'vetsaas_amount',
        'vetsaas_clinic_commission',
        'partner_amount',
        'partner_clinic_commission',
        'currency',
        'active',
        'is_default',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'vetsaas_amount' => 'decimal:2',
            'vetsaas_clinic_commission' => 'decimal:2',
            'partner_amount' => 'decimal:2',
            'partner_clinic_commission' => 'decimal:2',
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
     * @return list<string>
     */
    public static function channels(): array
    {
        return [
            self::CHANNEL_DIRECT,
            self::CHANNEL_VETSAAS,
            self::CHANNEL_PARTNER,
        ];
    }

    /**
     * Precio Culqi + reparto según canal de inscripción.
     *
     * @return array{channel: string, amount: float, platform_amount: float, clinic_commission: float, currency: string}
     */
    public function pricingFor(string $channel): array
    {
        $channel = strtolower(trim($channel));
        if (! in_array($channel, self::channels(), true)) {
            throw new InvalidArgumentException('Canal de plan inválido: '.$channel);
        }

        $currency = (string) $this->currency;

        if ($channel === self::CHANNEL_DIRECT) {
            $amount = (float) $this->amount;

            return [
                'channel' => $channel,
                'amount' => $amount,
                'platform_amount' => $amount,
                'clinic_commission' => 0.0,
                'currency' => $currency,
            ];
        }

        if ($channel === self::CHANNEL_VETSAAS) {
            $amount = (float) ($this->vetsaas_amount ?? $this->amount);
            $clinic = (float) ($this->vetsaas_clinic_commission ?? 0);

            return $this->split($channel, $amount, $clinic, $currency);
        }

        $amount = (float) ($this->partner_amount ?? $this->amount);
        $clinic = (float) ($this->partner_clinic_commission ?? 0);

        return $this->split($channel, $amount, $clinic, $currency);
    }

    /**
     * @return array{channel: string, amount: float, platform_amount: float, clinic_commission: float, currency: string}
     */
    private function split(string $channel, float $amount, float $clinic, string $currency): array
    {
        if ($clinic < 0) {
            $clinic = 0.0;
        }
        if ($clinic > $amount) {
            $clinic = $amount;
        }

        return [
            'channel' => $channel,
            'amount' => round($amount, 2),
            'platform_amount' => round($amount - $clinic, 2),
            'clinic_commission' => round($clinic, 2),
            'currency' => $currency,
        ];
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
