<?php

namespace App\Services\Public;

use App\Models\ChipRegistration;
use App\Models\LostReport;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class PublicLostWallService
{
    public const PER_PAGE = 12;

    /**
     * @param  array{city?: string|null, species?: string|null, page?: int|null}  $filters
     * @return array{
     *     items: LengthAwarePaginator,
     *     filters: array{city: string|null, species: string|null},
     *     cities: list<string>,
     *     species: list<string>,
     *     total_open: int
     * }
     */
    public function wall(array $filters = []): array
    {
        $city = filled($filters['city'] ?? null) ? trim((string) $filters['city']) : null;
        $species = filled($filters['species'] ?? null) ? trim((string) $filters['species']) : null;

        $base = LostReport::query()
            ->where('lost_reports.status', LostReport::STATUS_OPEN)
            ->whereHas('registration', function ($q): void {
                $q->where('status', ChipRegistration::STATUS_LOST);
            })
            ->with([
                'registration.animal',
                'registration.organization',
            ]);

        if ($city !== null) {
            $base->where(function ($q) use ($city): void {
                $q->where('last_seen_city', $city)
                    ->orWhere('distrito', $city)
                    ->orWhere('provincia', $city)
                    ->orWhere('departamento', $city);
            });
        }

        if ($species !== null) {
            $base->whereHas('registration.animal', function ($q) use ($species): void {
                $q->where('species', $species);
            });
        }

        /** @var LengthAwarePaginator $paginator */
        $paginator = (clone $base)
            ->orderByDesc('lost_at')
            ->orderByDesc('id')
            ->paginate(self::PER_PAGE)
            ->withQueryString()
            ->through(fn (LostReport $report) => $this->toPublicCard($report));

        return [
            'items' => $paginator,
            'filters' => [
                'city' => $city,
                'species' => $species,
            ],
            'cities' => $this->availableCities(),
            'species' => $this->availableSpecies(),
            'total_open' => LostReport::query()
                ->where('status', LostReport::STATUS_OPEN)
                ->whereHas('registration', fn ($q) => $q->where('status', ChipRegistration::STATUS_LOST))
                ->count(),
        ];
    }

    /**
     * @return list<string>
     */
    public function availableCities(): array
    {
        /** @var Collection<int, string|null> $rows */
        $rows = LostReport::query()
            ->where('status', LostReport::STATUS_OPEN)
            ->whereHas('registration', fn ($q) => $q->where('status', ChipRegistration::STATUS_LOST))
            ->get(['last_seen_city', 'distrito', 'provincia', 'departamento']);

        $cities = $rows
            ->flatMap(fn (LostReport $r) => [
                $r->last_seen_city,
                $r->distrito,
                $r->provincia,
                $r->departamento,
            ])
            ->filter(fn ($v) => filled($v))
            ->map(fn ($v) => trim((string) $v))
            ->unique()
            ->sort(SORT_NATURAL | SORT_FLAG_CASE)
            ->values()
            ->all();

        return array_values($cities);
    }

    /**
     * @return list<string>
     */
    public function availableSpecies(): array
    {
        return LostReport::query()
            ->where('lost_reports.status', LostReport::STATUS_OPEN)
            ->whereHas('registration', fn ($q) => $q->where('status', ChipRegistration::STATUS_LOST))
            ->join('chip_registrations', 'chip_registrations.id', '=', 'lost_reports.registration_id')
            ->join('animals', 'animals.id', '=', 'chip_registrations.animal_id')
            ->whereNotNull('animals.species')
            ->where('animals.species', '!=', '')
            ->distinct()
            ->orderBy('animals.species')
            ->pluck('animals.species')
            ->map(fn ($v) => (string) $v)
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    public function toPublicCard(LostReport $report): array
    {
        $chip = $report->registration;
        $animal = $chip?->animal;
        $photo = $report->photoUrl() ?: $animal?->photoUrl();

        $place = collect([
            $report->last_seen_zone,
            $report->distrito,
            $report->last_seen_city,
            $report->provincia,
            $report->departamento,
        ])
            ->filter(fn ($v) => filled($v))
            ->map(fn ($v) => trim((string) $v))
            ->unique()
            ->take(3)
            ->values()
            ->all();

        return [
            'id' => $report->id,
            'name' => $animal?->name,
            'species' => $animal?->species,
            'breed' => $animal?->breed,
            'color' => $animal?->color,
            'photo_url' => $photo,
            'public_code' => $chip?->public_code,
            'profile_url' => $chip?->public_code
                ? url('/p/'.$chip->public_code)
                : null,
            'lost_at' => $report->lost_at?->toIso8601String(),
            'place' => $place,
            'public_notes' => $report->public_notes
                ? \Illuminate\Support\Str::limit(trim($report->public_notes), 160)
                : null,
            'clinic_city' => $chip?->organization?->city,
        ];
    }
}
