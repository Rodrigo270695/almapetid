<?php

namespace App\Services\LostFound;

use App\Models\ChipRegistration;
use App\Models\FoundReport;
use App\Models\LostReport;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class FoundReportService
{
    public function __construct(
        private readonly LostFoundNotifier $notifier,
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

        $this->notifyAfterResponse($registration->id, $found->id);

        $found->update([
            'notified_owner_at' => now(),
        ]);

        return $found->fresh();
    }

    private function notifyAfterResponse(int $registrationId, int $foundId): void
    {
        dispatch(function () use ($registrationId, $foundId): void {
            $registration = ChipRegistration::query()->find($registrationId);
            $found = FoundReport::query()->find($foundId);

            if ($registration === null || $found === null) {
                return;
            }

            app(LostFoundNotifier::class)->notifyFound($registration, $found);
        })->afterResponse();
    }
}
