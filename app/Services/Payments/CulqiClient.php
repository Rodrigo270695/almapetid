<?php

namespace App\Services\Payments;

use Illuminate\Support\Facades\Http;

class CulqiClient
{
    private function baseUrl(): string
    {
        return rtrim((string) config('culqi.base_url', 'https://api.culqi.com/v2'), '/');
    }

    private function secretKey(): string
    {
        $key = trim((string) config('culqi.secret_key'));

        if ($key === '') {
            throw new \RuntimeException('Configura CULQI_SECRET_KEY en .env para usar Culqi.');
        }

        return $key;
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public function createCharge(array $payload): array
    {
        $response = Http::timeout(25)
            ->acceptJson()
            ->withToken($this->secretKey())
            ->post($this->baseUrl().'/charges', $payload);

        if (! $response->successful()) {
            throw new \RuntimeException(
                'Culqi create charge falló ('.$response->status().'): '.$response->body(),
            );
        }

        /** @var array<string, mixed> $json */
        $json = $response->json() ?? [];

        return $json;
    }

    public function ping(): void
    {
        $response = Http::timeout(15)
            ->acceptJson()
            ->withToken($this->secretKey())
            ->get($this->baseUrl().'/charges?limit=1');

        if (! $response->successful()) {
            throw new \RuntimeException(
                'Culqi ping falló ('.$response->status().'): '.$response->body(),
            );
        }
    }
}
