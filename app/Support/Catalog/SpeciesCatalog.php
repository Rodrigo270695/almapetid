<?php

namespace App\Support\Catalog;

use App\Models\Breed;
use App\Models\Species;

final class SpeciesCatalog
{
    /**
     * @return list<array{id: int, name: string, breeds: list<array{id: int, name: string}>}>
     */
    public static function activeTree(): array
    {
        return Species::query()
            ->where('active', true)
            ->with(['breeds' => fn ($q) => $q->where('active', true)->orderBy('sort_order')->orderBy('name')])
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name', 'slug'])
            ->map(fn (Species $s) => [
                'id' => $s->id,
                'name' => $s->name,
                'breeds' => $s->breeds->map(fn (Breed $b) => [
                    'id' => $b->id,
                    'name' => $b->name,
                ])->values()->all(),
            ])
            ->values()
            ->all();
    }

    /**
     * @return array{0: string, 1: string|null}
     */
    public static function resolveNames(int $speciesId, ?int $breedId): array
    {
        $species = Species::query()->whereKey($speciesId)->where('active', true)->firstOrFail();
        $breedName = null;

        if ($breedId !== null) {
            $breed = Breed::query()
                ->whereKey($breedId)
                ->where('species_id', $species->id)
                ->where('active', true)
                ->firstOrFail();
            $breedName = $breed->name;
        }

        return [$species->name, $breedName];
    }
}
