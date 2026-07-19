<?php

namespace App\Http\Controllers;

use App\Services\Owners\OwnerClaimService;
use App\Support\Auth\HomePath;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request, OwnerClaimService $claim): Response|RedirectResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 403);

        if ($user->isClinicUser()) {
            return redirect()->to(HomePath::for($user));
        }

        $owner = $claim->claimForUser($user) ?? $user->ownerProfile;
        $owner?->loadMissing('createdByOrganization');

        $animals = [];
        if ($owner !== null) {
            $animals = $owner->animals()
                ->with(['chipRegistration.organization'])
                ->latest()
                ->get()
                ->map(fn ($animal): array => [
                    'id' => $animal->id,
                    'name' => $animal->name,
                    'species' => $animal->species,
                    'breed' => $animal->breed,
                    'chip' => $animal->chipRegistration ? [
                        'microchip' => $animal->chipRegistration->microchip,
                        'public_code' => $animal->chipRegistration->public_code,
                        'status' => $animal->chipRegistration->status,
                        'registered_at' => $animal->chipRegistration->registered_at?->toIso8601String(),
                        'organization' => $animal->chipRegistration->organization ? [
                            'name' => $animal->chipRegistration->organization->name,
                            'ruc' => $animal->chipRegistration->organization->ruc,
                        ] : null,
                    ] : null,
                ])
                ->all();
        }

        return Inertia::render('dashboard', [
            'owner' => $owner ? [
                'name' => $owner->fullName(),
                'document_number' => $owner->document_number,
                'created_by_clinic' => $owner->createdByOrganization?->name,
            ] : null,
            'animals' => $animals,
        ]);
    }
}
