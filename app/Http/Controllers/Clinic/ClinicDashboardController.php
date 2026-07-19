<?php

namespace App\Http\Controllers\Clinic;

use App\Http\Controllers\Controller;
use App\Models\ChipRegistration;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ClinicDashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user !== null, 403);

        $organization = $user->primaryOrganization();
        abort_unless($organization !== null, 403);

        $recent = ChipRegistration::query()
            ->with(['animal.owner', 'organization'])
            ->where('organization_id', $organization->id)
            ->latest('registered_at')
            ->limit(12)
            ->get()
            ->map(fn (ChipRegistration $chip): array => [
                'id' => $chip->id,
                'microchip' => $chip->microchip,
                'public_code' => $chip->public_code,
                'certificate_code' => $chip->certificate_code,
                'status' => $chip->status,
                'registered_at' => $chip->registered_at?->toIso8601String(),
                'animal' => [
                    'name' => $chip->animal?->name,
                    'species' => $chip->animal?->species,
                ],
                'owner' => [
                    'name' => $chip->animal?->owner?->fullName(),
                    'document_number' => $chip->animal?->owner?->document_number,
                ],
            ]);

        $stats = [
            'registrations' => ChipRegistration::query()
                ->where('organization_id', $organization->id)
                ->count(),
            'active' => ChipRegistration::query()
                ->where('organization_id', $organization->id)
                ->where('status', 'active')
                ->count(),
        ];

        return Inertia::render('clinic/dashboard', [
            'organization' => [
                'id' => $organization->id,
                'name' => $organization->name,
                'ruc' => $organization->ruc,
                'address' => $organization->address,
            ],
            'stats' => $stats,
            'recent' => $recent,
        ]);
    }
}
