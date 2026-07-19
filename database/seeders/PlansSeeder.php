<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlansSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'code' => 'registro-unico',
                'name' => 'Registro único',
                'description' => 'Fee por alta de mascota en AlmaPet ID (certificado + QR).',
                'billing_period' => Plan::PERIOD_REGISTRATION,
                'duration_months' => null,
                'amount' => 25.00,
                'currency' => 'PEN',
                'active' => true,
                'is_default' => true,
                'sort_order' => 1,
            ],
            [
                'code' => 'plan-anual',
                'name' => 'Plan anual',
                'description' => 'Vigencia anual del registro (renovación).',
                'billing_period' => Plan::PERIOD_ANNUAL,
                'duration_months' => 12,
                'amount' => 40.00,
                'currency' => 'PEN',
                'active' => true,
                'is_default' => false,
                'sort_order' => 2,
            ],
        ];

        foreach ($plans as $data) {
            Plan::query()->updateOrCreate(
                ['code' => $data['code']],
                $data,
            );
        }
    }
}
