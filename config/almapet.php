<?php

declare(strict_types=1);

return [
    'physical_carnet_amount' => (float) env('ALMAPET_PHYSICAL_CARNET_AMOUNT', 30),
    /** Fee digital cuando registra una veterinaria externa (no VetSaaS). */
    'clinic_external_digital_amount' => (float) env('ALMAPET_CLINIC_EXTERNAL_DIGITAL_AMOUNT', 20),
    'support_phone_display' => env('ALMAPET_SUPPORT_PHONE_DISPLAY', '976 809 804'),
    'support_phone_e164' => env('ALMAPET_SUPPORT_PHONE_E164', '51976809804'),
];
