<?php

namespace App\Services\Integrations;

use App\Exceptions\ApiPeruConsultaException;
use App\Services\Integrations\Concerns\FallsBackToApisunatLookup;
use Illuminate\Support\Facades\Cache;
use RuntimeException;
use Throwable;

/**
 * Consulta RUC vía apiperu.dev, con respaldo APISUNAT si falla.
 */
final class ApiPeruRucService
{
    use FallsBackToApisunatLookup;

    public function __construct(
        private readonly ApisunatLookupService $apisunatLookup,
    ) {}

    /**
     * @return array{
     *     ruc: string,
     *     name: string,
     *     address: string|null,
     * }
     */
    public function consultar(string $ruc): array
    {
        $ruc = preg_replace('/\D+/', '', $ruc) ?? '';

        if (strlen($ruc) !== 11) {
            throw new RuntimeException(__('El RUC debe tener 11 dígitos.'));
        }

        $cacheKey = "almapet:documento:ruc:{$ruc}";

        return Cache::remember($cacheKey, now()->addDays(30), function () use ($ruc): array {
            return $this->consultarConFallbackApisunat(
                fn (): array => $this->fetchFromApiPeru($ruc),
                fn (): array => $this->apisunatLookup->consultarRuc($ruc),
            );
        });
    }

    /**
     * @return array{
     *     ruc: string,
     *     name: string,
     *     address: string|null,
     * }
     */
    private function fetchFromApiPeru(string $ruc): array
    {
        try {
            $response = ApiPeruHttp::client()->post('/ruc', ['ruc' => $ruc]);
        } catch (ApiPeruConsultaException $e) {
            throw $e;
        } catch (Throwable $e) {
            throw new ApiPeruConsultaException(
                __('El servicio de consulta no está disponible.'),
                503,
                'service_unavailable',
                $e,
            );
        }

        ApiPeruHttp::assertSuccessful($response);

        $json = $response->json();
        if (! is_array($json) || ! ($json['success'] ?? false)) {
            $msg = is_string($json['message'] ?? null)
                ? $json['message']
                : __('No se encontraron datos para el RUC indicado.');

            throw new ApiPeruConsultaException($msg, 422, 'not_found');
        }

        $data = $json['data'] ?? null;
        if (! is_array($data)) {
            throw new ApiPeruConsultaException(
                __('Respuesta de API RUC inválida.'),
                422,
                'invalid_response',
            );
        }

        $razon = trim((string) ($data['nombre_o_razon_social'] ?? ''));
        if ($razon === '') {
            throw new ApiPeruConsultaException(
                __('La API no devolvió razón social para este RUC.'),
                422,
                'empty_data',
            );
        }

        $direccion = $data['direccion_completa'] ?? $data['direccion'] ?? null;
        $direccion = is_string($direccion) && $direccion !== '' ? $direccion : null;

        return [
            'ruc' => $ruc,
            'name' => mb_substr($razon, 0, 255),
            'address' => $direccion,
        ];
    }
}
