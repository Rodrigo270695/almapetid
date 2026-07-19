<?php

namespace Database\Seeders;

use App\Models\Organization;
use Illuminate\Database\Seeder;

/**
 * Clínicas demo con logo para el carrusel de la red (hasta que haya logos reales).
 */
class NetworkClinicsSeeder extends Seeder
{
    public function run(): void
    {
        $clinics = [
            [
                'ruc' => '20100000001',
                'name' => 'Clínica VetNova',
                'city' => 'Lima',
                'logo_path' => '/images/clinics/demo-vetnova.svg',
            ],
            [
                'ruc' => '20100000002',
                'name' => 'Patitas Center',
                'city' => 'Arequipa',
                'logo_path' => '/images/clinics/demo-patitas.svg',
            ],
            [
                'ruc' => '20100000003',
                'name' => 'Animalia Vet',
                'city' => 'Trujillo',
                'logo_path' => '/images/clinics/demo-animalia.svg',
            ],
            [
                'ruc' => '20100000004',
                'name' => 'Huella Clínica',
                'city' => 'Cusco',
                'logo_path' => '/images/clinics/demo-huella.svg',
            ],
            [
                'ruc' => '20100000005',
                'name' => 'San Roque Vet',
                'city' => 'Piura',
                'logo_path' => '/images/clinics/demo-sanroque.svg',
            ],
            [
                'ruc' => '20100000006',
                'name' => 'Mascotas+',
                'city' => 'Chiclayo',
                'logo_path' => '/images/clinics/demo-mascotas.svg',
            ],
        ];

        foreach ($clinics as $index => $clinic) {
            Organization::query()->updateOrCreate(
                ['ruc' => $clinic['ruc']],
                [
                    'type' => 'clinic',
                    'name' => $clinic['name'],
                    'city' => $clinic['city'],
                    'country_code' => 'PE',
                    'logo_path' => $clinic['logo_path'],
                    'active' => true,
                    'show_on_network' => true,
                    'contact_email' => null,
                    'contact_phone' => null,
                ],
            );
        }
    }
}
