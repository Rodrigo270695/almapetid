<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\ChipRegistration;
use App\Services\LostFound\FoundReportService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PublicPetProfileController extends Controller
{
    public function show(string $publicCode): Response
    {
        $chip = $this->findByPublicCode($publicCode);
        $chip->load(['animal', 'organization', 'openLostReport']);

        $animal = $chip->animal;
        abort_unless($animal !== null, 404);

        $lost = $chip->openLostReport;

        return Inertia::render('public/pet-profile', [
            'pet' => [
                'name' => $animal->name,
                'species' => $animal->species,
                'breed' => $animal->breed,
                'sex' => $animal->sex,
                'color' => $animal->color,
                'photo_url' => $animal->photoUrl(),
                'status' => $chip->status,
                'public_code' => $chip->public_code,
                'city' => $chip->organization?->city,
                'clinic_name' => $chip->organization?->name,
                'is_lost' => $chip->isLost(),
                'lost' => $lost ? [
                    'lost_at' => $lost->lost_at?->toIso8601String(),
                    'last_seen_zone' => $lost->last_seen_zone,
                    'last_seen_city' => $lost->last_seen_city,
                    'public_notes' => $lost->public_notes,
                    'photo_url' => $lost->photoUrl(),
                ] : null,
            ],
        ]);
    }

    public function found(
        Request $request,
        string $publicCode,
        FoundReportService $found,
    ): RedirectResponse {
        $chip = $this->findByPublicCode($publicCode);

        $data = $request->validate([
            'reporter_name' => ['required', 'string', 'max:120'],
            'reporter_phone' => ['nullable', 'string', 'max:40'],
            'reporter_email' => ['nullable', 'email', 'max:255'],
            'message' => ['required', 'string', 'max:2000'],
            'city' => ['nullable', 'string', 'max:120'],
            'zone' => ['nullable', 'string', 'max:200'],
        ]);

        if (blank($data['reporter_phone'] ?? null) && blank($data['reporter_email'] ?? null)) {
            return back()
                ->withErrors([
                    'reporter_phone' => 'Indica un teléfono o un email de contacto.',
                ])
                ->withInput();
        }

        $found->report($chip, [
            'reporter_name' => $data['reporter_name'],
            'reporter_phone' => $data['reporter_phone'] ?? null,
            'reporter_email' => $data['reporter_email'] ?? null,
            'message' => $data['message'],
            'city' => $data['city'] ?? null,
            'zone' => $data['zone'] ?? null,
        ]);

        return redirect()
            ->route('public.pet.show', ['publicCode' => $chip->public_code])
            ->with('success', 'Gracias. Avisamos al tutor sin compartir su teléfono contigo.');
    }

    private function findByPublicCode(string $publicCode): ChipRegistration
    {
        $code = strtoupper(trim($publicCode));

        return ChipRegistration::query()
            ->whereRaw('UPPER(public_code) = ?', [$code])
            ->firstOrFail();
    }
}
