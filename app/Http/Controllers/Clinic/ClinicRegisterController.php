<?php

namespace App\Http\Controllers\Clinic;

use App\Http\Controllers\Controller;
use App\Http\Requests\Clinic\ClinicRegisterRequest;
use App\Services\Clinics\ClinicRegistrationService;
use App\Support\Geo\GeoCatalog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class ClinicRegisterController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('auth/clinic-register', [
            'passwordRules' => Password::defaults()->toPasswordRulesString(),
            'departamentos' => GeoCatalog::departamentosPeru(),
        ]);
    }

    public function store(
        ClinicRegisterRequest $request,
        ClinicRegistrationService $clinics,
    ): RedirectResponse {
        $user = $clinics->register($request->validated());

        Auth::login($user);
        $request->session()->regenerate();

        return redirect()
            ->route('clinic.dashboard')
            ->with('toast', [
                'type' => 'success',
                'message' => __('Veterinaria registrada correctamente.'),
            ]);
    }
}
