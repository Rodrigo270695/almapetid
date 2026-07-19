<?php

namespace App\Support\Geo;

use App\Models\Departamento;

/**
 * Props compartidas para formularios con cascada geográfica.
 */
final class GeoCatalog
{
    /**
     * @return list<array{id: int, name: string}>
     */
    public static function departamentosPeru(): array
    {
        return Departamento::query()
            ->where('pais_id', GeoDefaults::PAIS_ID_PERU)
            ->where('status', true)
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(static fn (Departamento $d): array => [
                'id' => (int) $d->id,
                'name' => (string) $d->name,
            ])
            ->values()
            ->all();
    }
}
