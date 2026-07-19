<?php

return [

    /*
    |--------------------------------------------------------------------------
    | VetSaaS — showcase + bridge AlmaPet
    |--------------------------------------------------------------------------
    */

    'base_url' => rtrim((string) env('VETSAAS_BASE_URL', env('VETSAAS_PUBLIC_URL', 'https://vetsaas.orvae.pe')), '/'),

    'showcase_path' => (string) env('VETSAAS_SHOWCASE_PATH', '/api/public/vetsaas/showcase'),

    'showcase_cache_seconds' => (int) env('VETSAAS_SHOWCASE_CACHE_SECONDS', 600),

    'timeout_seconds' => (int) env('VETSAAS_HTTP_TIMEOUT', 12),

    /*
    |--------------------------------------------------------------------------
    | Handoff (VetSaaS → AlmaPet)
    |--------------------------------------------------------------------------
    |
    | VetSaaS llama POST /api/v1/handoff con este secret y recibe una URL
    | one-time. El mismo valor debe estar en PETPASS_HANDOFF_SECRET de VetSaaS.
    |
    */

    'handoff_secret' => (string) env('ALMAPET_HANDOFF_SECRET', env('PETPASS_HANDOFF_SECRET', '')),

    'handoff_ttl_minutes' => (int) env('ALMAPET_HANDOFF_TTL_MINUTES', 30),

    /*
    |--------------------------------------------------------------------------
    | Webhooks salientes (AlmaPet → VetSaaS)
    |--------------------------------------------------------------------------
    */

    'webhook_url' => (string) env(
        'VETSAAS_WEBHOOK_URL',
        rtrim((string) env('VETSAAS_BASE_URL', env('VETSAAS_PUBLIC_URL', 'https://vetsaas.orvae.pe')), '/').'/api/webhooks/almapet',
    ),

    'webhook_secret' => (string) env('ALMAPET_WEBHOOK_SECRET', env('PETPASS_WEBHOOK_SECRET', '')),

    'webhook_enabled' => (bool) env('ALMAPET_WEBHOOK_ENABLED', true),

];
