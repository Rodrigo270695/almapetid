<?php

namespace App\Services\Payments;

use App\Models\Plan;
use App\Models\RegistrationPayment;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class RegistrationPaymentService
{
    public function createPendingCulqiPayment(
        User $user,
        Plan $plan,
        string $channel = Plan::CHANNEL_DIRECT,
    ): RegistrationPayment {
        if (! $plan->active) {
            throw ValidationException::withMessages([
                'plan_id' => 'Este plan no está disponible.',
            ]);
        }

        $pricing = $plan->pricingFor($channel);

        return RegistrationPayment::query()->create([
            'plan_id' => $plan->id,
            'user_id' => $user->id,
            'amount' => $pricing['amount'],
            'currency' => $pricing['currency'],
            'channel' => $pricing['channel'],
            'platform_amount' => $pricing['platform_amount'],
            'clinic_commission' => $pricing['clinic_commission'],
            'status' => RegistrationPayment::STATUS_PENDING,
            'provider' => RegistrationPayment::PROVIDER_CULQI,
            'created_by_user_id' => $user->id,
            'notes' => 'Checkout Culqi · '.$plan->code.' · canal '.$pricing['channel'],
        ]);
    }

    /**
     * @param  array<string, mixed>|null  $rawResponse
     */
    public function markPaid(
        RegistrationPayment $payment,
        string $providerReference,
        ?array $rawResponse = null,
    ): RegistrationPayment {
        if ($payment->status === RegistrationPayment::STATUS_PAID) {
            return $payment;
        }

        return DB::transaction(function () use ($payment, $providerReference, $rawResponse): RegistrationPayment {
            $locked = RegistrationPayment::query()
                ->whereKey($payment->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($locked->status === RegistrationPayment::STATUS_PAID) {
                return $locked;
            }

            $duplicate = RegistrationPayment::query()
                ->where('provider', RegistrationPayment::PROVIDER_CULQI)
                ->where('provider_reference', $providerReference)
                ->whereKeyNot($locked->id)
                ->exists();

            if ($duplicate) {
                return $locked;
            }

            $notes = $locked->notes;
            if ($rawResponse !== null) {
                $outcome = (string) data_get($rawResponse, 'outcome.user_message', '');
                if ($outcome !== '') {
                    $notes = trim(($notes ? $notes.' · ' : '').$outcome);
                }
            }

            $locked->update([
                'status' => RegistrationPayment::STATUS_PAID,
                'provider' => RegistrationPayment::PROVIDER_CULQI,
                'provider_reference' => $providerReference,
                'paid_at' => now(),
                'notes' => $notes,
            ]);

            return $locked->fresh();
        });
    }

    public function markFailed(RegistrationPayment $payment, ?string $reason = null): RegistrationPayment
    {
        if ($payment->status === RegistrationPayment::STATUS_PAID) {
            return $payment;
        }

        $payment->update([
            'status' => RegistrationPayment::STATUS_FAILED,
            'notes' => trim(($payment->notes ? $payment->notes.' · ' : '').($reason ?? 'Cobro fallido')),
        ]);

        return $payment->fresh();
    }

    public function findConsumablePaidForUser(User $user, ?int $paymentId = null): ?RegistrationPayment
    {
        $query = RegistrationPayment::query()
            ->where('user_id', $user->id)
            ->where('status', RegistrationPayment::STATUS_PAID)
            ->whereNull('chip_registration_id')
            ->latest('paid_at');

        if ($paymentId !== null) {
            $query->whereKey($paymentId);
        }

        return $query->first();
    }
}
