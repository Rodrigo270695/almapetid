<?php

namespace App\Http\Controllers\PublicSite;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\RegistrationPayment;
use App\Services\Integrations\HandoffRegistrationService;
use App\Services\Payments\CulqiClient;
use App\Services\Payments\RegistrationPaymentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Checkout Culqi guest para handoff VetSaaS (sin login de dueño).
 */
final class HandoffCheckoutController extends Controller
{
    public function show(Request $request, RegistrationPayment $payment): Response|RedirectResponse
    {
        if (! $this->canAccess($request, $payment)) {
            return redirect()
                ->route('home')
                ->with('error', 'Sesión de pago no válida o expirada.');
        }

        if ($payment->status === RegistrationPayment::STATUS_PAID) {
            $payment->loadMissing('chipRegistration');

            return redirect()
                ->route('public.handoff.success', $payment->chipRegistration?->certificate_code ?? 'x');
        }

        if ($payment->status !== RegistrationPayment::STATUS_PENDING) {
            return redirect()
                ->route('home')
                ->with('error', 'Este pago ya no está pendiente.');
        }

        // Alinea montos pendientes con el plan actual (p. ej. VetSaaS bajó a S/15).
        $this->syncPendingPricing($payment);

        $payment->load([
            'plan:id,code,name',
            'chipRegistration.animal',
            'organization:id,name',
        ]);

        $email = $this->paymentEmail($payment);

        return Inertia::render('public/handoff/checkout', [
            'payment' => [
                'id' => $payment->id,
                'amount' => (float) $payment->amount,
                'currency' => $payment->currency,
                'channel' => $payment->channel,
                'platform_amount' => (float) ($payment->platform_amount ?? $payment->amount),
                'clinic_commission' => (float) ($payment->clinic_commission ?? 0),
                'plan_name' => $payment->plan?->name,
                'email' => $email,
                'clinic_name' => $payment->organization?->name,
                'animal_name' => $payment->chipRegistration?->animal?->name,
                'microchip' => $payment->chipRegistration?->microchip,
            ],
            'culqi' => [
                'enabled' => $this->culqiEnabled(),
                'publicKey' => (string) config('culqi.public_key'),
                'checkoutScriptUrl' => (string) config(
                    'culqi.checkout_script_url',
                    'https://js.culqi.com/checkout-js',
                ),
                'commerceName' => (string) config('app.name', 'AlmaPet ID'),
            ],
        ]);
    }

    public function charge(
        Request $request,
        RegistrationPayment $payment,
        CulqiClient $culqi,
        RegistrationPaymentService $payments,
        HandoffRegistrationService $handoff,
    ): RedirectResponse {
        if (! $this->canAccess($request, $payment)) {
            return redirect()
                ->route('home')
                ->with('error', 'Sesión de pago no válida o expirada.');
        }

        if ($payment->status === RegistrationPayment::STATUS_PAID) {
            $payment->loadMissing('chipRegistration');

            return redirect()
                ->route('public.handoff.success', $payment->chipRegistration?->certificate_code ?? 'x');
        }

        if ($payment->status !== RegistrationPayment::STATUS_PENDING) {
            return redirect()
                ->route('public.handoff.checkout', $payment)
                ->with('error', 'El pago no está pendiente.');
        }

        $this->syncPendingPricing($payment);

        if (! $this->culqiEnabled()) {
            return redirect()
                ->route('public.handoff.checkout', $payment)
                ->with('error', 'Culqi no está configurado. Revisa CULQI_PUBLIC_KEY y CULQI_SECRET_KEY.');
        }

        $validated = $request->validate([
            'token_id' => ['required', 'string', 'max:200'],
        ]);

        $tokenId = trim((string) $validated['token_id']);
        $amountCents = (int) round(((float) $payment->amount) * 100);
        $email = $this->paymentEmail($payment);

        if ($amountCents <= 0) {
            return redirect()
                ->route('public.handoff.checkout', $payment)
                ->with('error', 'El monto no es válido para Culqi.');
        }

        $payload = [
            'amount' => $amountCents,
            'currency_code' => strtoupper((string) $payment->currency),
            'email' => $email,
            'source_id' => $tokenId,
            'description' => 'AlmaPet handoff #'.$payment->id,
            'capture' => true,
            'metadata' => [
                'payment_id' => (string) $payment->id,
                'plan_id' => (string) ($payment->plan_id ?? ''),
                'channel' => (string) ($payment->channel ?? Plan::CHANNEL_VETSAAS),
                'chip_registration_id' => (string) ($payment->chip_registration_id ?? ''),
                'platform_amount' => (string) ($payment->platform_amount ?? $payment->amount),
                'clinic_commission' => (string) ($payment->clinic_commission ?? 0),
            ],
        ];

        try {
            $charge = $culqi->createCharge($payload);
        } catch (\Throwable $e) {
            $payments->markFailed($payment, $e->getMessage());

            return redirect()
                ->route('public.handoff.checkout', $payment)
                ->with('error', 'No se pudo procesar el cobro: '.$e->getMessage());
        }

        $chargeId = (string) ($charge['id'] ?? '');
        if ($chargeId === '' || ! $this->isChargeApproved($charge)) {
            $message = (string) data_get($charge, 'outcome.user_message', '');
            if ($message === '') {
                $message = 'El cobro fue rechazado por Culqi.';
            }
            $payments->markFailed($payment, $message);

            return redirect()
                ->route('public.handoff.checkout', $payment)
                ->with('error', $message);
        }

        $payments->markPaid($payment, $chargeId, $charge);
        $registration = $handoff->activateAfterPayment($payment->fresh() ?? $payment);

        $request->session()->forget('handoff_payment_id');

        return redirect()
            ->route('public.handoff.success', $registration->certificate_code)
            ->with('success', 'Pago confirmado. Registro AlmaPet ID activado.');
    }

    public function success(string $code): Response
    {
        return Inertia::render('public/handoff/success', [
            'certificate_code' => $code,
            'certificate_url' => url('/certificado/'.$code),
            'search_url' => url('/buscar'),
        ]);
    }

    private function canAccess(Request $request, RegistrationPayment $payment): bool
    {
        if ($payment->channel !== Plan::CHANNEL_VETSAAS) {
            return false;
        }

        if ($payment->chip_registration_id === null) {
            return false;
        }

        $sessionId = (int) $request->session()->get('handoff_payment_id', 0);

        return $sessionId === (int) $payment->id;
    }

    private function paymentEmail(RegistrationPayment $payment): string
    {
        $payment->loadMissing(['chipRegistration.animal.owner', 'organization']);

        $ownerEmail = $payment->chipRegistration?->animal?->owner?->email;
        if (filled($ownerEmail)) {
            return (string) $ownerEmail;
        }

        if (filled($payment->organization?->contact_email)) {
            return (string) $payment->organization->contact_email;
        }

        if (preg_match('/·\s*(\S+@\S+)\s*$/', (string) $payment->notes, $m) === 1) {
            return $m[1];
        }

        return 'pago@almapetid.com';
    }

    private function syncPendingPricing(RegistrationPayment $payment): void
    {
        if ($payment->status !== RegistrationPayment::STATUS_PENDING) {
            return;
        }

        $channel = (string) ($payment->channel ?: Plan::CHANNEL_VETSAAS);
        $plan = $payment->plan_id
            ? Plan::query()->find($payment->plan_id)
            : null;

        if ($plan === null) {
            $plan = Plan::query()
                ->where('active', true)
                ->where('billing_period', Plan::PERIOD_REGISTRATION)
                ->orderByDesc('is_default')
                ->orderBy('sort_order')
                ->first();
        }

        if ($plan === null) {
            return;
        }

        $pricing = $plan->pricingFor($channel);

        if (
            (float) $payment->amount === $pricing['amount']
            && (float) ($payment->platform_amount ?? 0) === $pricing['platform_amount']
            && (float) ($payment->clinic_commission ?? 0) === $pricing['clinic_commission']
        ) {
            return;
        }

        $payment->forceFill([
            'plan_id' => $plan->id,
            'amount' => $pricing['amount'],
            'currency' => $pricing['currency'],
            'channel' => $pricing['channel'],
            'platform_amount' => $pricing['platform_amount'],
            'clinic_commission' => $pricing['clinic_commission'],
        ])->save();

        $payment->refresh();
    }

    private function culqiEnabled(): bool
    {
        return trim((string) config('culqi.public_key')) !== ''
            && trim((string) config('culqi.secret_key')) !== '';
    }

    /**
     * @param  array<string, mixed>  $charge
     */
    private function isChargeApproved(array $charge): bool
    {
        if (($charge['paid'] ?? false) === true) {
            return true;
        }

        $status = strtolower((string) ($charge['status'] ?? ''));
        if (in_array($status, ['paid', 'captured', 'succeeded'], true)) {
            return true;
        }

        return strtolower((string) data_get($charge, 'outcome.type', '')) === 'venta_exitosa';
    }
}
