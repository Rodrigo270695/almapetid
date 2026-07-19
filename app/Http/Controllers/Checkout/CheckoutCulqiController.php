<?php

namespace App\Http\Controllers\Checkout;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\RegistrationPayment;
use App\Services\Payments\CulqiClient;
use App\Services\Payments\RegistrationPaymentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CheckoutCulqiController extends Controller
{
    public function start(
        Request $request,
        RegistrationPaymentService $payments,
    ): RedirectResponse {
        $user = $request->user();
        abort_unless($user !== null, 403);

        if (! $this->culqiEnabled()) {
            return redirect()
                ->route('animals.index')
                ->with('error', 'Culqi no está configurado todavía. Revisa las llaves en .env.');
        }

        $data = $request->validate([
            'plan_id' => ['required', 'integer', 'exists:plans,id'],
            'channel' => ['nullable', 'string', Rule::in(Plan::channels())],
        ]);

        $plan = Plan::query()->whereKey($data['plan_id'])->where('active', true)->firstOrFail();
        $channel = (string) ($data['channel'] ?? Plan::CHANNEL_DIRECT);
        $payment = $payments->createPendingCulqiPayment($user, $plan, $channel);

        return redirect()->route('checkout.culqi.show', $payment);
    }

    public function show(Request $request, RegistrationPayment $payment): Response|RedirectResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 403);

        if ((int) $payment->user_id !== (int) $user->id) {
            return redirect()
                ->route('animals.index')
                ->with('error', 'No se encontró el pago asociado a tu cuenta.');
        }

        if ($payment->status === RegistrationPayment::STATUS_PAID) {
            return redirect()
                ->route('animals.create', ['payment_id' => $payment->id])
                ->with('success', 'Este pago ya está confirmado. Continúa con el registro.');
        }

        if ($payment->status !== RegistrationPayment::STATUS_PENDING) {
            return redirect()
                ->route('animals.register')
                ->with('error', 'Este pago no está pendiente.');
        }

        $payment->load('plan:id,code,name');

        return Inertia::render('checkout/culqi', [
            'payment' => [
                'id' => $payment->id,
                'amount' => (float) $payment->amount,
                'currency' => $payment->currency,
                'plan_name' => $payment->plan?->name,
                'email' => (string) $user->email,
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
    ): RedirectResponse {
        $user = $request->user();
        abort_unless($user !== null, 403);

        if ((int) $payment->user_id !== (int) $user->id) {
            return redirect()
                ->route('animals.index')
                ->with('error', 'No autorizado para completar este pago.');
        }

        if ($payment->status === RegistrationPayment::STATUS_PAID) {
            return redirect()
                ->route('animals.create', ['payment_id' => $payment->id])
                ->with('success', 'Pago ya confirmado.');
        }

        if ($payment->status !== RegistrationPayment::STATUS_PENDING) {
            return redirect()
                ->route('animals.register')
                ->with('error', 'El pago no está pendiente.');
        }

        $validated = $request->validate([
            'token_id' => ['required', 'string', 'max:200'],
        ]);

        $tokenId = trim((string) $validated['token_id']);
        $amountCents = (int) round(((float) $payment->amount) * 100);

        if ($amountCents <= 0) {
            return redirect()
                ->route('checkout.culqi.show', $payment)
                ->with('error', 'El monto no es válido para Culqi.');
        }

        $payload = [
            'amount' => $amountCents,
            'currency_code' => strtoupper((string) $payment->currency),
            'email' => (string) $user->email,
            'source_id' => $tokenId,
            'description' => 'AlmaPet registro #'.$payment->id,
            'capture' => true,
            'metadata' => [
                'payment_id' => (string) $payment->id,
                'plan_id' => (string) ($payment->plan_id ?? ''),
                'user_id' => (string) $user->id,
                'channel' => (string) ($payment->channel ?? Plan::CHANNEL_DIRECT),
                'platform_amount' => (string) ($payment->platform_amount ?? $payment->amount),
                'clinic_commission' => (string) ($payment->clinic_commission ?? 0),
            ],
        ];

        try {
            $charge = $culqi->createCharge($payload);
        } catch (\Throwable $e) {
            $payments->markFailed($payment, $e->getMessage());

            return redirect()
                ->route('checkout.culqi.show', $payment)
                ->with('error', 'No se pudo procesar el cobro con Culqi: '.$e->getMessage());
        }

        $chargeId = (string) ($charge['id'] ?? '');
        if ($chargeId === '') {
            return redirect()
                ->route('checkout.culqi.show', $payment)
                ->with('error', 'Culqi no devolvió identificador de cobro.');
        }

        if (! $this->isChargeApproved($charge)) {
            $message = (string) data_get($charge, 'outcome.user_message', '');
            if ($message === '') {
                $message = (string) data_get($charge, 'outcome.merchant_message', '');
            }
            if ($message === '') {
                $message = 'El cobro fue rechazado por Culqi.';
            }

            $payments->markFailed($payment, $message);

            return redirect()
                ->route('animals.register')
                ->with('error', $message);
        }

        $payments->markPaid($payment, $chargeId, $charge);

        return redirect()
            ->route('animals.create', ['payment_id' => $payment->id])
            ->with('success', 'Pago confirmado. Ahora registra tu mascota.');
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
