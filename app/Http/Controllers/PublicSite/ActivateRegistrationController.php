<?php

namespace App\Http\Controllers\PublicSite;

use App\Http\Controllers\Controller;
use App\Models\ChipRegistration;
use App\Models\Plan;
use App\Services\Owners\OwnerClaimService;
use App\Services\Payments\RegistrationPaymentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Activación del carnet digital por el dueño (tras registro desde VetSaaS).
 * Requiere login; si no hay sesión → register/login y vuelve aquí.
 */
final class ActivateRegistrationController extends Controller
{
    public function show(
        Request $request,
        string $publicCode,
        OwnerClaimService $claim,
    ): Response|RedirectResponse {
        $registration = ChipRegistration::query()
            ->with(['animal.owner', 'organization'])
            ->where('public_code', $publicCode)
            ->first();

        if ($registration === null) {
            return Inertia::render('public/activate/invalid', [
                'reason' => 'not_found',
            ]);
        }

        if ($registration->isActive() || $registration->isLost()) {
            return redirect()
                ->route('animals.show', $registration->animal_id)
                ->with('success', 'Esta mascota ya está activa en AlmaPet ID.');
        }

        if (! $registration->isPendingPayment()) {
            return Inertia::render('public/activate/invalid', [
                'reason' => 'unavailable',
            ]);
        }

        $user = $request->user();
        if ($user === null) {
            return redirect()->guest(route('login'));
        }

        if ($user->isClinicUser()) {
            return redirect()->route('dashboard')
                ->with('error', 'Usa una cuenta de dueño para activar el carnet.');
        }

        $owner = $claim->claimForUser($user) ?? $user->ownerProfile;
        $chipOwner = $registration->animal?->owner;
        if ($owner === null || $chipOwner === null || (int) $owner->id !== (int) $chipOwner->id) {
            return Inertia::render('public/activate/invalid', [
                'reason' => 'not_owner',
                'hint' => 'Debes registrarte con el mismo documento (DNI) que usó la clínica.',
            ]);
        }

        $plan = Plan::query()
            ->where('active', true)
            ->where('billing_period', Plan::PERIOD_REGISTRATION)
            ->orderByDesc('is_default')
            ->first();

        $digital = $plan?->pricingFor(Plan::CHANNEL_VETSAAS)['amount'] ?? 25.0;
        $physical = (float) config('almapet.physical_carnet_amount', 30);

        return Inertia::render('public/activate/show', [
            'public_code' => $registration->public_code,
            'animal' => [
                'name' => $registration->animal?->name,
                'species' => $registration->animal?->species,
                'breed' => $registration->animal?->breed,
                'sex' => $registration->animal?->sex,
            ],
            'microchip' => $registration->microchip,
            'clinic_name' => $registration->organization?->name,
            'pricing' => [
                'digital_amount' => (float) $digital,
                'physical_amount' => $physical,
                'currency' => 'PEN',
            ],
            'support_phone' => (string) config('almapet.support_phone_display', '976 809 804'),
            'culqi_ready' => $this->culqiEnabled(),
            'plan_id' => $plan?->id,
        ]);
    }

    public function checkout(
        Request $request,
        string $publicCode,
        OwnerClaimService $claim,
        RegistrationPaymentService $payments,
    ): RedirectResponse {
        $user = $request->user();
        abort_unless($user !== null, 403);

        $data = $request->validate([
            'include_physical' => ['sometimes', 'boolean'],
        ]);

        $registration = ChipRegistration::query()
            ->with(['animal.owner'])
            ->where('public_code', $publicCode)
            ->firstOrFail();

        if (! $registration->isPendingPayment()) {
            throw ValidationException::withMessages([
                'public_code' => 'Este registro ya no está pendiente de activación.',
            ]);
        }

        $owner = $claim->claimForUser($user) ?? $user->ownerProfile;
        if ($owner === null || (int) $owner->id !== (int) $registration->animal?->owner_id) {
            abort(403);
        }

        if (! $this->culqiEnabled()) {
            throw ValidationException::withMessages([
                'payment' => 'Culqi no está configurado.',
            ]);
        }

        $plan = Plan::query()
            ->where('active', true)
            ->where('billing_period', Plan::PERIOD_REGISTRATION)
            ->orderByDesc('is_default')
            ->firstOrFail();

        $payment = $payments->createActivationCulqiPayment(
            $user,
            $plan,
            $registration,
            (bool) ($data['include_physical'] ?? false),
            Plan::CHANNEL_VETSAAS,
        );

        return redirect()->route('checkout.culqi.show', $payment);
    }

    private function culqiEnabled(): bool
    {
        return trim((string) config('culqi.public_key')) !== ''
            && trim((string) config('culqi.secret_key')) !== '';
    }
}
