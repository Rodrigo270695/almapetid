<?php

namespace App\Support;

use App\Models\ChipRegistration;
use App\Models\Plan;

final class RegistrationPricing
{
    public static function channelFor(ChipRegistration $registration): string
    {
        return filled($registration->vetsaas_tenant_id)
            ? Plan::CHANNEL_VETSAAS
            : Plan::CHANNEL_PARTNER;
    }

    /**
     * @return array{channel: string, amount: float, platform_amount: float, clinic_commission: float, currency: string, physical_amount: float}
     */
    public static function forActivation(ChipRegistration $registration, Plan $plan): array
    {
        $channel = self::channelFor($registration);
        $pricing = $plan->pricingFor($channel);

        if ($channel === Plan::CHANNEL_PARTNER) {
            $amount = (float) config('almapet.clinic_external_digital_amount', 20);
            $clinic = min((float) $pricing['clinic_commission'], $amount);
            $pricing['amount'] = round($amount, 2);
            $pricing['clinic_commission'] = round($clinic, 2);
            $pricing['platform_amount'] = round($amount - $clinic, 2);
        }

        $pricing['physical_amount'] = (float) config('almapet.physical_carnet_amount', 30);

        return $pricing;
    }
}
