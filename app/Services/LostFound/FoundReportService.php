<?php

namespace App\Services\LostFound;

use App\Models\ChipRegistration;
use App\Models\FoundReport;
use App\Models\LostReport;
use App\Services\Push\PushNotificationService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class FoundReportService
{
    public function __construct(
        private readonly PushNotificationService $push,
    ) {}

    /**
     * @param  array{
     *     reporter_name: string,
     *     reporter_phone?: string|null,
     *     reporter_email?: string|null,
     *     message: string,
     *     city?: string|null,
     *     zone?: string|null,
     * }  $data
     */
    public function report(ChipRegistration $registration, array $data): FoundReport
    {
        if (! $registration->isLost()) {
            throw ValidationException::withMessages([
                'status' => 'Solo se puede reportar hallazgo de una mascota marcada como perdida.',
            ]);
        }

        $openLost = $registration->lostReports()
            ->where('status', LostReport::STATUS_OPEN)
            ->latest('id')
            ->first();

        $found = DB::transaction(function () use ($registration, $openLost, $data): FoundReport {
            return FoundReport::query()->create([
                'registration_id' => $registration->id,
                'lost_report_id' => $openLost?->id,
                'reporter_name' => $data['reporter_name'],
                'reporter_phone' => $data['reporter_phone'] ?? null,
                'reporter_email' => $data['reporter_email'] ?? null,
                'message' => $data['message'],
                'city' => $data['city'] ?? null,
                'zone' => $data['zone'] ?? null,
            ]);
        });

        $this->notifyOwner($registration, $found);

        return $found->fresh();
    }

    private function notifyOwner(ChipRegistration $registration, FoundReport $found): void
    {
        $registration->loadMissing(['animal.owner.user']);

        $ownerUser = $registration->animal?->owner?->user;
        $animalId = $registration->animal_id;
        $animalName = $registration->animal?->name ?? 'tu mascota';

        if ($ownerUser !== null && $animalId !== null) {
            $this->push->sendToUsers(collect([$ownerUser]), [
                'title' => '¡Posible hallazgo!',
                'body' => "Alguien reportó haber encontrado a {$animalName}.",
                'url' => '/animals/'.$animalId,
                'tag' => 'found-report-'.$found->id,
            ]);
        }

        $found->update([
            'notified_owner_at' => now(),
        ]);
    }
}
