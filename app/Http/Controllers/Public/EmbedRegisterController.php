<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Requests\Embed\StoreEmbedChipRegistrationRequest;
use App\Models\Organization;
use App\Services\Clinics\ClinicOwnerActivationNotifier;
use App\Services\Clinics\ClinicRegistrationService;
use App\Services\Integrations\HandoffRegistrationService;
use App\Support\Catalog\SpeciesCatalog;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class EmbedRegisterController extends Controller
{
    public function show(string $token): Response
    {
        $organization = $this->resolveOrganization($token);

        return Inertia::render('embed/register', [
            'token' => $token,
            'organization' => [
                'name' => $organization->name,
                'logo_url' => $organization->logoUrl(),
                'city' => $organization->city,
            ],
            'species_catalog' => SpeciesCatalog::activeTree(),
            'pricing' => [
                'digital_amount' => (float) config('almapet.clinic_external_digital_amount', 20),
                'physical_amount' => (float) config('almapet.physical_carnet_amount', 30),
            ],
            'support_phone' => (string) config('almapet.support_phone_display', '976 809 804'),
            'success' => session('embed_register_success'),
        ]);
    }

    public function store(
        StoreEmbedChipRegistrationRequest $request,
        string $token,
        ClinicRegistrationService $clinics,
        ClinicOwnerActivationNotifier $notifier,
        HandoffRegistrationService $handoff,
    ): RedirectResponse {
        $organization = $this->resolveOrganization($token);

        $chip = $clinics->registerOwnerAnimalChip(
            null,
            $organization,
            $request->validated(),
        );

        $chip->load(['animal.owner', 'organization']);
        $wa = $notifier->notify($chip);

        $payload = [
            'public_code' => $chip->public_code,
            'animal_name' => $chip->animal?->name,
            'activate_url' => $handoff->activateUrl($chip),
            'whatsapp_url' => $wa['whatsapp_url'],
            'whatsapp_sent' => $wa['sent'],
        ];

        $redirect = redirect()
            ->route('embed.register.show', ['token' => $token])
            ->with('embed_register_success', $payload)
            ->with('success', 'Registro creado a nombre de '.$organization->name.'. Pendiente de pago del propietario.');

        if (! empty($wa['whatsapp_url'])) {
            $redirect->with('whatsapp_url', $wa['whatsapp_url']);
        }

        return $redirect;
    }

    private function resolveOrganization(string $token): Organization
    {
        $token = trim($token);
        abort_if($token === '' || strlen($token) < 16, 404);

        $organization = Organization::query()
            ->where('embed_registration_token', $token)
            ->where('type', 'clinic')
            ->where('active', true)
            ->first();

        abort_if($organization === null, 404);

        return $organization;
    }
}
