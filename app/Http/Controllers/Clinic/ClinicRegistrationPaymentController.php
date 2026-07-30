<?php

namespace App\Http\Controllers\Clinic;

use App\Http\Controllers\Controller;
use App\Models\ChipRegistration;
use App\Models\Plan;
use App\Services\Clinics\ClinicOwnerActivationNotifier;
use App\Services\Payments\RegistrationPaymentService;
use App\Support\RegistrationPricing;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ClinicRegistrationPaymentController extends Controller
{
    public function pay(
        Request $request,
        ChipRegistration $registration,
        RegistrationPaymentService $payments,
    ): RedirectResponse {
        $user = $request->user();
        abort_unless($user !== null, 403);

        $organization = $user->primaryOrganization();
        abort_unless(
            $organization !== null
            && (int) $registration->organization_id === (int) $organization->id,
            403,
        );

        if (! $registration->isPendingPayment()) {
            throw ValidationException::withMessages([
                'registration' => 'Este registro ya no está pendiente de pago.',
            ]);
        }

        if (! $this->culqiEnabled()) {
            throw ValidationException::withMessages([
                'payment' => 'Culqi no está configurado.',
            ]);
        }

        $data = $request->validate([
            'include_physical' => ['sometimes', 'boolean'],
        ]);

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
            RegistrationPricing::channelFor($registration),
        );

        return redirect()->route('checkout.culqi.show', $payment);
    }

    public function resendWhatsApp(
        Request $request,
        ChipRegistration $registration,
        ClinicOwnerActivationNotifier $notifier,
    ): RedirectResponse {
        $user = $request->user();
        abort_unless($user !== null, 403);

        $organization = $user->primaryOrganization();
        abort_unless(
            $organization !== null
            && (int) $registration->organization_id === (int) $organization->id,
            403,
        );

        if (! $registration->isPendingPayment()) {
            throw ValidationException::withMessages([
                'registration' => 'Solo se puede notificar registros pendientes de pago.',
            ]);
        }

        $result = $notifier->notify($registration->load(['animal.owner', 'organization']));

        if ($result['sent']) {
            return redirect()
                ->route('clinic.registrations.index')
                ->with('success', 'WhatsApp enviado al propietario.');
        }

        if ($result['whatsapp_url']) {
            return redirect()
                ->route('clinic.registrations.index')
                ->with('warning', $result['error'] ?? 'No se pudo enviar automáticamente. Abre el enlace de WhatsApp.')
                ->with('whatsapp_url', $result['whatsapp_url']);
        }

        return redirect()
            ->route('clinic.registrations.index')
            ->with('error', $result['error'] ?? 'No se pudo preparar el mensaje de WhatsApp.');
    }

    private function culqiEnabled(): bool
    {
        return trim((string) config('culqi.public_key')) !== ''
            && trim((string) config('culqi.secret_key')) !== '';
    }
}
