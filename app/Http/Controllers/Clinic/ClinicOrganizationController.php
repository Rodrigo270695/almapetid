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
        ]);
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
