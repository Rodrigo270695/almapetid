<?php

namespace App\Support;

use Carbon\Carbon;

final class DateRange
{
    /**
     * @return array{desde: string, hasta: string}
     */
    public static function thisMonth(?string $timezone = null): array
    {
        $tz = $timezone ?: (string) config('app.timezone', 'America/Lima');
        $now = Carbon::now($tz);

        return [
            'desde' => $now->copy()->startOfMonth()->toDateString(),
            'hasta' => $now->copy()->endOfMonth()->toDateString(),
        ];
    }

    /**
     * @return array{desde: string, hasta: string}
     */
    public static function resolve(
        ?string $desde,
        ?string $hasta,
        ?string $timezone = null,
    ): array {
        $defaults = self::thisMonth($timezone);

        $desde = is_string($desde) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $desde) === 1
            ? $desde
            : $defaults['desde'];

        $hasta = is_string($hasta) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $hasta) === 1
            ? $hasta
            : $defaults['hasta'];

        if ($desde > $hasta) {
            [$desde, $hasta] = [$hasta, $desde];
        }

        return [
            'desde' => $desde,
            'hasta' => $hasta,
            'default_desde' => $defaults['desde'],
            'default_hasta' => $defaults['hasta'],
        ];
    }
}
