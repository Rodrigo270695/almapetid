<?php

namespace App\Http\Controllers\PublicSite;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Services\Integrations\HandoffRegistrationService;
use App\Services\Integrations\HandoffTokenService;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

final class HandoffController extends Controller
{
    public function show(Request $request, HandoffTokenService $tokens): Response|RedirectResponse
    {
        $plain = (string) $request->query('token', '');

        try {
            $token = $tokens->findConsumable($plain);

            if ($token === null) {
                return Inertia::render('public/handoff/invalid', [
                    'reason' => $plain === '' ? 'missing' : 'expired',
                ]);
            }

            $payload = is_array($token->payload) ? $token->payload : [];
            $clinic = is_array($payload['clinic'] ?? null) ? $payload['clinic'] : [];
            $animal = is_array($payload['animal'] ?? null) ? $payload['animal'] : [];
            $owner = is_array($payload['owner'] ?? null) ? $payload['owner'] : [];
            $pricing = $this->vetsaasPricing();

            return Inertia::render('public/handoff/confirm', [
                'token' => $plain,
                'expires_at' => $token->expires_at?->toIso8601String(),
                'clinic_name' => $clinic['name'] ?? null,
                'animal' => [
                    'name' => $animal['name'] ?? null,
                    'species' => $animal['species'] ?? null,
                    'breed' => $animal['breed'] ?? null,
                ],
                'owner_name' => $this->ownerDisplayName($owner),
                'microchip' => $payload['microchip'] ?? null,
                'pricing' => $pricing,
                'culqi_ready' => $this->culqiEnabled(),
            ]);
        } catch (Throwable $e) {
            report($e);
            Log::error('Handoff show failed', [
                'token_prefix' => substr($plain, 0, 8),
                'message' => $e->getMessage(),
            ]);

            return Inertia::render('public/handoff/invalid', [
                'reason' => 'expired',
                'error_detail' => app()->hasDebugModeEnabled()
                    ? $e->getMessage()
                    : null,
            ]);
        }
    }

    public function confirm(
        Request $request,
        HandoffTokenService $tokens,
        HandoffRegistrationService $registration,
    ): RedirectResponse {
        $data = $request->validate([
            'token' => ['required', 'string', 'max:80'],
            'accept_terms' => ['accepted'],
        ]);

        if (! $this->culqiEnabled()) {
            throw ValidationException::withMessages([
                'token' => 'Culqi no está configurado. No se puede completar el registro con pago.',
            ]);
        }

        $token = $tokens->findConsumable($data['token']);
        if ($token === null) {
            throw ValidationException::withMessages([
                'token' => 'Este enlace ya expiró o fue usado.',
            ]);
        }

        try {
            $result = $registration->confirm($token);
        } catch (ValidationException $e) {
            throw $e;
        } catch (QueryException $e) {
            report($e);
            Log::error('Handoff confirm database error', ['message' => $e->getMessage()]);

            throw ValidationException::withMessages([
                'token' => 'Error de base de datos al preparar el pago. En el servidor ejecuta: php artisan migrate --force',
            ]);
        } catch (Throwable $e) {
            report($e);
            Log::error('Handoff confirm failed', ['message' => $e->getMessage()]);

            throw ValidationException::withMessages([
                'token' => 'No se pudo preparar el pago. Intenta generar un nuevo enlace desde VetSaaS.',
            ]);
        }

        $payment = $result['payment'];

        $request->session()->put('handoff_payment_id', $payment->id);

        return redirect()
            ->route('public.handoff.checkout', $payment)
            ->with('success', 'Datos confirmados. Completa el pago para activar el registro.');
    }

    /**
     * @return array{amount: float, currency: string, platform_amount: float, clinic_commission: float, plan_name: string|null}|null
     */
    private function vetsaasPricing(): ?array
    {
        $plan = Plan::query()
            ->where('active', true)
            ->where('billing_period', Plan::PERIOD_REGISTRATION)
            ->orderByDesc('is_default')
            ->orderBy('sort_order')
            ->first();

        if ($plan === null) {
            return null;
        }

        $pricing = $plan->pricingFor(Plan::CHANNEL_VETSAAS);

        return [
            'amount' => $pricing['amount'],
            'currency' => $pricing['currency'],
            'platform_amount' => $pricing['platform_amount'],
            'clinic_commission' => $pricing['clinic_commission'],
            'plan_name' => $plan->name,
        ];
    }

    private function culqiEnabled(): bool
    {
        return trim((string) config('culqi.public_key')) !== ''
            && trim((string) config('culqi.secret_key')) !== '';
    }

    /**
     * @param  array<string, mixed>  $owner
     */
    private function ownerDisplayName(array $owner): string
    {
        if (filled($owner['full_name'] ?? null)) {
            return (string) $owner['full_name'];
        }

        return trim(((string) ($owner['name'] ?? '')).' '.((string) ($owner['lastname'] ?? '')));
    }
}
