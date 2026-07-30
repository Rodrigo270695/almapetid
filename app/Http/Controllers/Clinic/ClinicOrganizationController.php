<?php

namespace App\Http\Controllers\Clinic;

use App\Http\Controllers\Controller;
use App\Http\Requests\Clinic\UpdateOrganizationRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ClinicOrganizationController extends Controller
{
    public function edit(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user !== null, 403);

        $organization = $user->primaryOrganization();
        abort_unless($organization !== null, 404);

        $token = $organization->ensureEmbedRegistrationToken();

        return Inertia::render('clinic/settings/index', [
            'organization' => [
                'id' => $organization->id,
                'type' => $organization->type,
                'ruc' => $organization->ruc,
                'name' => $organization->name,
                'address' => $organization->address,
                'city' => $organization->city,
                'country_code' => $organization->country_code,
                'contact_email' => $organization->contact_email,
                'contact_phone' => $organization->contact_phone,
                'logo_url' => $organization->logoUrl(),
                'show_on_network' => $organization->show_on_network,
                'active' => $organization->active,
            ],
            'embed' => $this->searchEmbedSnippet((int) $organization->id),
            'embed_register' => $this->registerEmbedSnippet($token, (string) $organization->name),
        ]);
    }

    public function regenerateEmbedToken(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 403);

        $organization = $user->primaryOrganization();
        abort_unless($organization !== null, 404);

        $organization->regenerateEmbedRegistrationToken();

        return back()->with('success', 'Token del iframe de registro regenerado. Actualiza el código en tu web.');
    }

    /**
     * @return array{url: string, snippet: string}
     */
    private function searchEmbedSnippet(int $organizationId): array
    {
        $url = route('embed.search', ['ref' => $organizationId], absolute: true);
        $snippet = '<iframe'
            ."\n  src=\"".e($url)."\""
            ."\n  title=\"AlmaPet ID — Buscar microchip\""
            ."\n  width=\"100%\""
            ."\n  height=\"640\""
            ."\n  style=\"border:0;border-radius:16px;max-width:480px;background:#F7F9FB;\""
            ."\n  loading=\"lazy\""
            ."\n  referrerpolicy=\"no-referrer-when-downgrade\""
            ."\n></iframe>";

        return [
            'url' => $url,
            'snippet' => $snippet,
        ];
    }

    /**
     * @return array{url: string, snippet: string, token: string}
     */
    private function registerEmbedSnippet(string $token, string $clinicName): array
    {
        $url = route('embed.register.show', ['token' => $token], absolute: true);
        $title = 'AlmaPet ID — Registrar chip · '.e($clinicName);
        $snippet = '<iframe'
            ."\n  src=\"".e($url)."\""
            ."\n  title=\"{$title}\""
            ."\n  width=\"100%\""
            ."\n  height=\"920\""
            ."\n  style=\"border:0;border-radius:16px;max-width:560px;background:#F7F9FB;\""
            ."\n  loading=\"lazy\""
            ."\n  referrerpolicy=\"no-referrer-when-downgrade\""
            ."\n></iframe>";

        return [
            'url' => $url,
            'snippet' => $snippet,
            'token' => $token,
        ];
    }

    public function update(UpdateOrganizationRequest $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 403);

        $organization = $user->primaryOrganization();
        abort_unless($organization !== null, 404);

        $data = $request->safe()->except(['logo']);

        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('clinic-logos', 'public');
            if (filled($organization->logo_path)
                && ! str_starts_with((string) $organization->logo_path, '/')
                && ! str_starts_with((string) $organization->logo_path, 'http')) {
                Storage::disk('public')->delete($organization->logo_path);
            }
            $data['logo_path'] = $path;
        }

        $organization->update($data);

        return back()->with('success', 'Datos de la veterinaria actualizados.');
    }
}
