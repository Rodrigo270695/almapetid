<?php

namespace App\Services\LostFound;

use App\Models\ChipRegistration;
use App\Models\LostReport;
use App\Models\User;
use App\Services\Integrations\VetSaasWebhookDispatcher;
use App\Support\Geo\LocationHydrator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class LostReportService
{
    public function __construct(
        private readonly VetSaasWebhookDispatcher $vetsaasWebhooks,
    ) {}

    /**
     * @param  array{
     *     lost_at: string|\DateTimeInterface,
     *     distrito_id: int,
     *     last_seen_lat?: float|null,
     *     last_seen_lng?: float|null,
     *     public_notes?: string|null,
     *     photo_path?: string|null,
     * }  $data
     */
    public function declare(ChipRegistration $registration, User $user, array $data): LostReport
    {
        $this->assertCanManage($registration, $user);

        if (! $registration->isActive()) {
            throw ValidationException::withMessages([
                'status' => 'Solo se puede declarar perdido un registro activo.',
            ]);
        }

        if ($registration->lostReports()->where('status', LostReport::STATUS_OPEN)->exists()) {
            throw ValidationException::withMessages([
                'status' => 'Ya existe un reporte de pérdida abierto.',
            ]);
        }

        $location = LocationHydrator::fromDistritoId((int) $data['distrito_id']);
        if ($location === null) {
            throw ValidationException::withMessages([
                'distrito_id' => 'Distrito no válido.',
            ]);
        }

        $zone = collect([
            $location['provincia'] ?? null,
            $location['departamento'] ?? null,
        ])->filter()->implode(' · ');

        $report = DB::transaction(function () use ($registration, $user, $data, $location, $zone): LostReport {
            $report = LostReport::query()->create([
                'registration_id' => $registration->id,
                'status' => LostReport::STATUS_OPEN,
                'lost_at' => $data['lost_at'],
                'distrito_id' => $location['distrito_id'],
                'departamento' => $location['departamento'],
                'provincia' => $location['provincia'],
                'distrito' => $location['distrito'],
                'last_seen_city' => $location['distrito'],
                'last_seen_zone' => $zone !== '' ? $zone : null,
                'last_seen_lat' => $data['last_seen_lat'] ?? null,
                'last_seen_lng' => $data['last_seen_lng'] ?? null,
                'public_notes' => $data['public_notes'] ?? null,
                'photo_path' => $data['photo_path'] ?? null,
                'declared_by_user_id' => $user->id,
            ]);

            $registration->update([
                'status' => ChipRegistration::STATUS_LOST,
            ]);

            return $report;
        });

        $this->vetsaasWebhooks->dispatchLost($registration->fresh() ?? $registration);

        return $report;
    }

    public function recover(ChipRegistration $registration, User $user): LostReport
    {
        $this->assertCanManage($registration, $user);

        if (! $registration->isLost()) {
            throw ValidationException::withMessages([
                'status' => 'El registro no está marcado como perdido.',
            ]);
        }

        $open = $registration->lostReports()
            ->where('status', LostReport::STATUS_OPEN)
            ->latest('id')
            ->first();

        if ($open === null) {
            throw ValidationException::withMessages([
                'status' => 'No hay un reporte de pérdida abierto para recuperar.',
            ]);
        }

        $report = DB::transaction(function () use ($registration, $open): LostReport {
            $open->update([
                'status' => LostReport::STATUS_RECOVERED,
                'recovered_at' => now(),
            ]);

            $registration->update([
                'status' => ChipRegistration::STATUS_ACTIVE,
            ]);

            return $open->fresh();
        });

        $this->vetsaasWebhooks->dispatchRecovered($registration->fresh() ?? $registration);

        return $report;
    }

    public function assertCanManage(ChipRegistration $registration, User $user): void
    {
        $registration->loadMissing('animal.owner');

        $ownerUserId = $registration->animal?->owner?->user_id;
        if ($ownerUserId !== null && (int) $ownerUserId === (int) $user->id) {
            return;
        }

        if ($user->isClinicUser()) {
            $org = $user->primaryOrganization();
            if (
                $org !== null
                && $registration->organization_id !== null
                && (int) $registration->organization_id === (int) $org->id
            ) {
                return;
            }
        }

        abort(403);
    }
}
