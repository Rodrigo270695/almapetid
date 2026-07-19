<?php

namespace App\Http\Controllers\Clinic;

use App\Enums\DocumentType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Clinic\StoreChipRegistrationRequest;
use App\Services\Clinics\ClinicRegistrationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
        ]);
    }

    public function store(
        StoreChipRegistrationRequest $request,
        ClinicRegistrationService $clinics,
    ): RedirectResponse {
        $user = $request->user();
        abort_unless($user !== null, 403);

        $organization = $user->primaryOrganization();
        abort_unless($organization !== null, 403);

        $chip = $clinics->registerOwnerAnimalChip(
            $user,
            $organization,
            $request->validated(),
        );

        return redirect()
            ->route('clinic.dashboard')
            ->with('toast', [
                'type' => 'success',
                'message' => __('Registro creado. Código :code', [
                    'code' => $chip->public_code,
                ]),
            ]);
    }
}
