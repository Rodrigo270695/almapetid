<?php

namespace App\Support\Geo;

use App\Models\Distrito;

/**
 * Hidrata nombres denormalizados a partir de distrito_id.
 *
 * @return array{
 *     distrito_id: int,
 *     distrito: string,
 *     provincia: string|null,
 *     departamento: string|null,
 *     city: string,
 * }
 */
final class LocationHydrator
{
    /**
     * @return array{
     *     distrito_id: int,
     *     distrito: string,
     *     provincia: string|null,
     *     departamento: string|null,
     *     city: string,
     *     provincia_id: int|null,
     *     departamento_id: int|null,
     * }|null
     */
    public static function fromDistritoId(?int $distritoId): ?array
    {
        if ($distritoId === null || $distritoId <= 0) {
            return null;
        }

        $distrito = Distrito::query()
            ->with(['provincia.departamento'])
            ->find($distritoId);

        if ($distrito === null) {
            return null;
        }

        return [
            'distrito_id' => (int) $distrito->id,
            'distrito' => (string) $distrito->name,
            'provincia' => $distrito->provincia?->name,
            'departamento' => $distrito->provincia?->departamento?->name,
            'city' => (string) $distrito->name,
            'provincia_id' => $distrito->provincia_id !== null
                ? (int) $distrito->provincia_id
                : null,
            'departamento_id' => $distrito->provincia?->departamento_id !== null
                ? (int) $distrito->provincia->departamento_id
                : null,
        ];
    }
}
