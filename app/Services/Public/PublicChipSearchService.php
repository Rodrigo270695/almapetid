<?php

namespace App\Services\Public;

use App\Models\ChipRegistration;

class PublicChipSearchService
{
    public const MIN_QUERY_LENGTH = 4;

    /**
     * Estados visibles en búsqueda pública (no drafts, pagos pendientes, bajas, etc.).
     *
     * @var list<string>
     */
    public const PUBLIC_STATUSES = [
        ChipRegistration::STATUS_ACTIVE,
        ChipRegistration::STATUS_LOST,
    ];

    /**
     * @return array{
     *     state: 'empty'|'invalid'|'found'|'not_found',
     *     q: string|null,
     *     result: array<string, mixed>|null
     * }
     */
    public function search(?string $raw): array
    {
        $q = trim((string) $raw);

        if ($q === '') {
            return [
                'state' => 'empty',
                'q' => null,
                'result' => null,
            ];
        }

        if (mb_strlen($q) < self::MIN_QUERY_LENGTH) {
            return [
                'state' => 'invalid',
                'q' => $q,
                'result' => null,
            ];
        }

        $chip = $this->findRegistration($q);

        if ($chip === null) {
            return [
                'state' => 'not_found',
                'q' => $q,
                'result' => null,
            ];
        }

        $chip->loadMissing(['animal', 'organization', 'openLostReport']);

        return [
            'state' => 'found',
            'q' => $q,
            'result' => $this->toPublicResult($chip),
        ];
    }

    public function findRegistration(string $q): ?ChipRegistration
    {
        $base = ChipRegistration::query()
            ->whereIn('status', self::PUBLIC_STATUSES);

        $upper = strtoupper($q);

        $byPublic = (clone $base)
            ->whereRaw('UPPER(public_code) = ?', [$upper])
            ->first();

        if ($byPublic !== null) {
            return $byPublic;
        }

        $byCertificate = (clone $base)
            ->whereRaw('UPPER(certificate_code) = ?', [$upper])
            ->first();

        if ($byCertificate !== null) {
            return $byCertificate;
        }

        $digits = preg_replace('/\D+/', '', $q) ?? '';

        if (strlen($digits) >= 9 && strlen($digits) <= 20) {
            return (clone $base)
                ->where('microchip', $digits)
                ->first();
        }

        return null;
    }

    /**
     * Payload público acotado (sin DNI, teléfono ni dirección del hogar).
     *
     * @return array<string, mixed>
     */
    public function toPublicResult(ChipRegistration $chip): array
    {
        $animal = $chip->animal;
        $lost = $chip->openLostReport;
        $microchip = (string) $chip->microchip;
        $masked = strlen($microchip) > 4
            ? str_repeat('•', max(strlen($microchip) - 4, 4)).substr($microchip, -4)
            : $microchip;

        return [
            'name' => $animal?->name,
            'species' => $animal?->species,
            'breed' => $animal?->breed,
            'sex' => $animal?->sex,
            'color' => $animal?->color,
            'photo_url' => $animal?->photoUrl(),
            'status' => $chip->status,
            'public_code' => $chip->public_code,
            'microchip_masked' => $masked,
            'country_code' => $chip->country_code,
            'city' => $chip->organization?->city,
            'clinic_name' => $chip->organization?->name,
            'is_lost' => $chip->isLost(),
            'profile_url' => url('/p/'.$chip->public_code),
            'lost' => $lost ? [
                'lost_at' => $lost->lost_at?->toIso8601String(),
                'last_seen_zone' => $lost->last_seen_zone,
                'last_seen_city' => $lost->last_seen_city,
                'public_notes' => $lost->public_notes,
                'photo_url' => $lost->photoUrl(),
            ] : null,
        ];
    }
}
