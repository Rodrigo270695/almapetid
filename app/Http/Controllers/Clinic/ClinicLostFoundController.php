<?php

namespace App\Http\Controllers\Clinic;

use App\Http\Controllers\Controller;
use App\Models\ChipRegistration;
use App\Services\LostFound\LostReportService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class ClinicLostFoundController extends Controller
{
    public function declare(
        Request $request,
        ChipRegistration $registration,
        LostReportService $lost,
    ): RedirectResponse {
        $user = $request->user();
        abort_unless($user !== null && $user->can('lost.declare'), 403);

        $this->assertClinicOwnsRegistration($user, $registration);

        $data = $request->validate([
            'lost_at' => ['required', 'date'],
            'distrito_id' => ['required', 'integer', Rule::exists('distritos', 'id')],
            'departamento_id' => ['nullable', 'integer', Rule::exists('departamentos', 'id')],
            'provincia_id' => ['nullable', 'integer', Rule::exists('provincias', 'id')],
            'public_notes' => ['nullable', 'string', 'max:2000'],
            'photo' => ['nullable', 'image', 'max:5120'],
        ]);

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('lost-reports', 'public');
        }

        try {
            $lost->declare($registration, $user, [
                'lost_at' => $data['lost_at'],
                'distrito_id' => (int) $data['distrito_id'],
                'public_notes' => $data['public_notes'] ?? null,
                'photo_path' => $photoPath,
            ]);
        } catch (\Throwable $e) {
            if ($photoPath) {
                Storage::disk('public')->delete($photoPath);
            }
            throw $e;
        }

        return redirect()
            ->route('clinic.registrations.index')
            ->with('success', 'Mascota declarada como perdida.');
    }

    public function recover(
        Request $request,
        ChipRegistration $registration,
        LostReportService $lost,
    ): RedirectResponse {
        $user = $request->user();
        abort_unless($user !== null && $user->can('lost.recover'), 403);

        $this->assertClinicOwnsRegistration($user, $registration);

        $lost->recover($registration, $user);

        return redirect()
            ->route('clinic.registrations.index')
            ->with('success', 'Mascota marcada como recuperada.');
    }

    private function assertClinicOwnsRegistration($user, ChipRegistration $registration): void
    {
        $org = $user->primaryOrganization();
        abort_unless($org !== null, 404);
        abort_unless(
            $registration->organization_id !== null
            && (int) $registration->organization_id === (int) $org->id,
            404,
        );
    }
}
