<?php

namespace App\Services\Integrations;

use App\Exceptions\ApiPeruConsultaException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

final class ApiPeruHttp
{
    public static function client(): PendingRequest
    {
        $token = trim((string) config('services.apiperu.token', ''));

        if ($token === '') {
            throw new ApiPeruConsultaException(
                __('La consulta de documento no está configurada.'),
                503,
                'not_configured',
            );
        }

        $base = rtrim((string) config('services.apiperu.base_url', 'https://apiperu.dev/api'), '/');

        return Http::timeout(25)
            ->acceptJson()
            ->withToken($token)
            ->baseUrl($base);
    }

    public static function assertSuccessful(Response $response): void
    {
        if ($response->successful()) {
            return;
        }

        $status = $response->status();

        if ($status === 429) {
            throw new ApiPeruConsultaException(
                __('Se alcanzó el límite de consultas. Intenta más tarde.'),
                429,
                'rate_limit',
            );
        }

        if ($status >= 500) {
            throw new ApiPeruConsultaException(
                __('El servicio de consulta no está disponible.'),
                503,
                'service_unavailable',
            );
        }

        throw new ApiPeruConsultaException(
            __('No se pudo consultar el documento (código :status).', ['status' => $status]),
            422,
            'api_error',
        );
    }
}
