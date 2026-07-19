<?php

return [

    /*
    |--------------------------------------------------------------------------
    | OpenWA — gateway WhatsApp (plataforma AlmaPet ID)
    |--------------------------------------------------------------------------
    |
    | Misma familia que VetSaaS: API self-hosted + panel admin para escanear QR.
    | En AlmaPet usamos una sesión de plataforma para alertas (perdido, hallazgo,
    | avisos desde superadmin).
    |
    */

    'enabled' => (bool) env('OPENWA_ENABLED', false),

    'api_url' => rtrim((string) env('OPENWA_API_URL', ''), '/'),

    'api_key' => env('OPENWA_API_KEY'),

    'admin_url' => rtrim((string) env('OPENWA_ADMIN_URL', ''), '/'),

    'timeout_seconds' => (int) env('OPENWA_TIMEOUT_SECONDS', 30),

    /*
    | Nombre de la sesión OpenWA de plataforma (crear/escanear en wa-admin).
    */
    'platform_session_name' => env('OPENWA_PLATFORM_SESSION_NAME', 'almapet-platform'),

];
