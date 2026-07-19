<?php

namespace App\Services\Integrations;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Clínicas VetSaaS con plan de pago y logo propio (carrusel público).
 *
 * @see https://vetsaas.orvae.pe/api/public/vetsaas/showcase
 */
final class VetSaasShowcaseClient
{
    /**
     * @return list<array{id: string, name: string, city: string|null, logo_url: string, plan: string|null, url: string|null}>
     */
    public function clinicsForNetwork(): array
    {
        $ttl = max(60, (int) config('vetsaas.showcase_cache_seconds', 600));

        return Cache::remember('almapet.vetsaas.showcase_clinics', $ttl, function (): array {
            return $this->fetchClinics();
        });
    }

    public function forgetCache(): void
    {
        Cache::forget('almapet.vetsaas.showcase_clinics');
    }

    /**
     * @return list<array{id: string, name: string, city: string|null, logo_url: string, plan: string|null, url: string|null}>
     */
    private function fetchClinics(): array
    {
        $base = rtrim((string) config('vetsaas.base_url'), '/');
        if ($base === '') {
            return [];
        }

        $url = $base.(string) config('vetsaas.showcase_path', '/api/public/vetsaas/showcase');

        try {
            $response = Http::timeout((int) config('vetsaas.timeout_seconds', 12))
                ->acceptJson()
                ->get($url);
        } catch (\Throwable $e) {
            Log::warning('VetSaaS showcase request failed', [
                'url' => $url,
                'error' => $e->getMessage(),
            ]);

            return [];
        }

        if (! $response->successful()) {
            Log::warning('VetSaaS showcase HTTP error', [
                'url' => $url,
                'status' => $response->status(),
            ]);

            return [];
        }

        $payload = $response->json();
        $rows = is_array($payload['data'] ?? null) ? $payload['data'] : [];

        $items = [];

        foreach ($rows as $row) {
            if (! is_array($row)) {
                continue;
            }

            $logo = trim((string) ($row['logo_url'] ?? ''));
            $name = trim((string) ($row['name'] ?? ''));
            $slug = trim((string) ($row['slug'] ?? ''));

            if ($logo === '' || $name === '') {
                continue;
            }

            $items[] = [
                'id' => $slug !== '' ? $slug : md5($name.$logo),
                'name' => $name,
                'city' => filled($row['plan'] ?? null) ? (string) $row['plan'] : null,
                'logo_url' => $logo,
                'plan' => filled($row['plan'] ?? null) ? (string) $row['plan'] : null,
                'url' => filled($row['subdomain_url'] ?? null) ? (string) $row['subdomain_url'] : null,
            ];
        }

        return $items;
    }
}
