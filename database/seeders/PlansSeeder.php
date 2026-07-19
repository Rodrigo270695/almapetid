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
                // VetSaaS: dueño paga 25 → AlmaPet 15 + clínica 10
                'vetsaas_amount' => 25.00,
                'vetsaas_clinic_commission' => 10.00,
                // Partner externo: dueño paga 25 → AlmaPet 20 + clínica 5
                'partner_amount' => 25.00,
                'partner_clinic_commission' => 5.00,
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
                // VetSaaS: precio convenio 30 → AlmaPet 20 + clínica 10
                'vetsaas_amount' => 30.00,
                'vetsaas_clinic_commission' => 10.00,
                // Partner: mantiene 40 → AlmaPet 35 + clínica 5
                'partner_amount' => 40.00,
                'partner_clinic_commission' => 5.00,
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
