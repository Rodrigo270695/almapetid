<?php

namespace App\Http\Controllers\PublicSite;

use App\Http\Controllers\Controller;
use App\Services\Integrations\HandoffRegistrationService;
use App\Services\Integrations\HandoffTokenService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

final class HandoffController extends Controller
{
    public function show(Request $request, HandoffTokenService $tokens): Response|RedirectResponse
    {
        $plain = (string) $request->query('token', '');
        $token = $tokens->findConsumable($plain);

        if ($token === null) {
            return Inertia::render('public/handoff/invalid', [
                'reason' => $plain === '' ? 'missing' : 'expired',
            ]);
        }

        $payload = $token->payload;

        return Inertia::render('public/handoff/confirm', [
            'token' => $plain,
            'expires_at' => $token->expires_at?->toIso8601String(),
            'clinic_name' => $payload['clinic']['name'] ?? null,
            'animal' => [
                'name' => $payload['animal']['name'] ?? null,
                'species' => $payload['animal']['species'] ?? null,
                'breed' => $payload['animal']['breed'] ?? null,
            ],
            'owner_name' => $this->ownerDisplayName($payload['owner'] ?? []),
            'microchip' => $payload['microchip'] ?? null,
        ]);
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

        $token = $tokens->findConsumable($data['token']);
        if ($token === null) {
            throw ValidationException::withMessages([
                'token' => 'Este enlace ya expiró o fue usado.',
            ]);
        }

        $chip = $registration->confirm($token);

        return redirect()
            ->route('public.certificate', $chip->certificate_code)
            ->with('success', 'Registro AlmaPet ID creado correctamente.');
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
