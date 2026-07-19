<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Animal;
use App\Services\LostFound\LostReportService;
use App\Services\Owners\OwnerClaimService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class AnimalLostController extends Controller
{
    public function declare(
        Request $request,
        Animal $animal,
        OwnerClaimService $claim,
        LostReportService $lost,
    ): RedirectResponse {
        $user = $request->user();
        abort_unless($user !== null && $user->can('lost.declare'), 403);
        abort_unless(! $user->isClinicUser(), 403);

        $this->assertOwnsAnimal($user, $animal, $claim);

        $chip = $animal->chipRegistration;
        abort_unless($chip !== null, 404);

        $data = $request->validate([
            'lost_at' => ['required', 'date'],
            'distrito_id' => ['required', 'integer', Rule::exists('distritos', 'id')],
            'departamento_id' => ['nullable', 'integer', Rule::exists('departamentos', 'id')],
            'provincia_id' => ['nullable', 'integer', Rule::exists('provincias', 'id')],
            'last_seen_lat' => ['nullable', 'numeric', 'between:-90,90'],
            'last_seen_lng' => ['nullable', 'numeric', 'between:-180,180'],
            'public_notes' => ['nullable', 'string', 'max:2000'],
            'photo' => ['nullable', 'image', 'max:5120'],
        ]);

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('lost-reports', 'public');
        }

        try {
            $lost->declare($chip, $user, [
                'lost_at' => $data['lost_at'],
                'distrito_id' => (int) $data['distrito_id'],
                'last_seen_lat' => isset($data['last_seen_lat']) ? (float) $data['last_seen_lat'] : null,
                'last_seen_lng' => isset($data['last_seen_lng']) ? (float) $data['last_seen_lng'] : null,
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
            ->route('animals.show', $animal)
            ->with('success', 'Mascota declarada como perdida.');
    }

    public function recover(
        Request $request,
        Animal $animal,
        OwnerClaimService $claim,
        LostReportService $lost,
    ): RedirectResponse {
        $user = $request->user();
        abort_unless($user !== null && $user->can('lost.recover'), 403);
        abort_unless(! $user->isClinicUser(), 403);

        $this->assertOwnsAnimal($user, $animal, $claim);

        $chip = $animal->chipRegistration;
        abort_unless($chip !== null, 404);

        $lost->recover($chip, $user);

        return redirect()
            ->route('animals.show', $animal)
            ->with('success', 'Mascota marcada como recuperada.');
    }

    private function assertOwnsAnimal($user, Animal $animal, OwnerClaimService $claim): void
    {
        $owner = $claim->claimForUser($user) ?? $user->ownerProfile;
        abort_unless($owner !== null, 404);
        abort_unless((int) $animal->owner_id === (int) $owner->id, 404);
    }
}
