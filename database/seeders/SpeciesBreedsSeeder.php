<?php

namespace Database\Seeders;

use App\Models\Breed;
use App\Models\Species;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class SpeciesBreedsSeeder extends Seeder
{
    public function run(): void
    {
        $catalog = [
            'Perro' => [
                'Mestizo',
                'Pastor Alemán',
                'Labrador Retriever',
                'Golden Retriever',
                'Bulldog',
                'Poodle',
                'Chihuahua',
                'Schnauzer',
                'Beagle',
                'Boxer',
            ],
            'Gato' => [
                'Mestizo',
                'Siamés',
                'Persa',
                'Maine Coon',
                'Bengalí',
                'British Shorthair',
            ],
            'Otro' => [
                'No especificado',
            ],
        ];

        $order = 1;
        foreach ($catalog as $speciesName => $breeds) {
            $slug = Str::slug($speciesName) ?: 'especie';
            $species = Species::query()->updateOrCreate(
                ['slug' => $slug],
                [
                    'name' => $speciesName,
                    'active' => true,
                    'sort_order' => $order++,
                ],
            );

            $breedOrder = 1;
            foreach ($breeds as $breedName) {
                Breed::query()->updateOrCreate(
                    [
                        'species_id' => $species->id,
                        'name' => $breedName,
                    ],
                    [
                        'active' => true,
                        'sort_order' => $breedOrder++,
                    ],
                );
            }
        }
    }
}
