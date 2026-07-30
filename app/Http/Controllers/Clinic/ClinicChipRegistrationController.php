<?php

namespace App\Http\Controllers\Clinic;

use App\Enums\DocumentType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Clinic\StoreChipRegistrationRequest;
use App\Models\Plan;
use App\Services\Clinics\ClinicOwnerActivationNotifier;
use App\Services\Clinics\ClinicRegistrationService;
use App\Services\Payments\RegistrationPaymentService;
use App\Support\Catalog\SpeciesCatalog;
use App\Support\RegistrationPricing;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ClinicChipRegistrationController extends Controller
{
    public function create(Request $request): Response
    {
        $organization = $request->user()?->primaryOrganization();
        abort_unless($organization !== null, 403);

        return Inertia::render('clinic/registrations/create', [
            'organization' => [
                'id' => $organization->id,
                'name' => $organization->name,
                'ruc' => $organization->ruc,
            ],
            'documentTypes' => DocumentType::values(),
            'species_catalog' => SpeciesCatalog::activeTree(),
            'pricing' => [
                'digital_amount' => (float) config('almapet.clinic_external_digital_amount', 20),
                'physical_amount' => (float) config('almapet.physical_carnet_amount', 30),
                'currency' => 'PEN',
            ],
            'culqi_ready' => $this->culqiEnabled(),
            'support_phone' => (string) config('almapet.support_phone_display', '976 809 804'),
        ]);
    }

    public function store(
        StoreChipRegistrationRequest $request,
        ClinicRegistrationService $clinics,
        ClinicOwnerActivationNotifier $notifier,
        RegistrationPaymentService $payments,
    ): RedirectResponse {
        $user = $request->user();
        abort_unless($user !== null, 403);

        $organization = $user->primaryOrganization();
        abort_unless($organization !== null, 403);

        $validated = $request->validated();
        $paymentMode = (string) ($validated['payment_mode'] ?? 'owner_whatsapp');
        $includePhysical = (bool) ($validated['include_physical'] ?? false);

        $chip = $clinics->registerOwnerAnimalChip(
            $user,
            $organization,
            $validated,
        );

        $chip->load(['animal.owner', 'organization']);

        if ($paymentMode === 'clinic_now') {
            if (! $this->culqiEnabled()) {
                throw ValidationException::withMessages([
                    'payment_mode' => 'Culqi no está configurado. Elige que pague el propietario.',
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
                $chip,
                $includePhysical,
                RegistrationPricing::channelFor($chip),
            );

            return redirect()
                ->route('checkout.culqi.show', $payment)
                ->with('success', __('Registro creado. Completa el pago para activar (:code).', [
                    'code' => $chip->public_code,
                ]));
        }

        $wa = $notifier->notify($chip);

        $redirect = redirect()->route('clinic.registrations.index');

        if ($wa['sent']) {
            $redirect->with('success', __('Registro creado. WhatsApp enviado al propietario (:code).', [
                'code' => $chip->public_code,
            ]));
        } else {
            $redirect->with('warning', __('Registro creado (:code). Envía el WhatsApp al propietario desde Registros.', [
                'code' => $chip->public_code,
            ]));
        }

        if (! empty($wa['whatsapp_url'])) {
            $redirect->with('whatsapp_url', $wa['whatsapp_url']);
        }

        return $redirect;
    }

    private function culqiEnabled(): bool
    {
        return trim((string) config('culqi.public_key')) !== ''
            && trim((string) config('culqi.secret_key')) !== '';
    }
}
