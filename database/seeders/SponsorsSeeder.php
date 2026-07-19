<?php

namespace Database\Seeders;

use App\Models\Sponsor;
use Illuminate\Database\Seeder;

class SponsorsSeeder extends Seeder
{
    public function run(): void
    {
        Sponsor::query()->updateOrCreate(
            ['code' => 'orvae'],
            [
                'name' => 'Orvae',
                'tagline' => 'Tecnología y producto digital detrás de la red AlmaPet ID.',
                'url' => 'https://orvae.pe/',
                'logo_path' => '/images/sponsors/orvae.svg',
                'active' => true,
                'featured' => true,
                'sort_order' => 1,
            ],
        );

        Sponsor::query()->updateOrCreate(
            ['code' => 'vetsaas'],
            [
                'name' => 'VetSaaS',
                'tagline' => 'Software clínico veterinario — registro de microchip hacia AlmaPet ID en un clic.',
                'url' => 'https://vetsaas.orvae.pe/',
                'logo_path' => '/images/sponsors/vetsaas.svg',
                'active' => true,
                'featured' => true,
                'sort_order' => 2,
            ],
        );
    }
}
