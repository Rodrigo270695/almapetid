<?php

namespace App\Services\Integrations;

use App\Exceptions\ApiPeruConsultaException;
use Illuminate\Support\Facades\Cache;
use RuntimeException;

/**
 * Consulta DNI vía apiperu.dev (POST /dni).
 */
final class ApiPeruDniService
{
    /**
     * @return array{
     *     dni: string,
     *     name: string,
     *     lastname: string,
     *     full_name: string,
     * }
     */
    public function consultar(string $dni): array
    {
        $dni = preg_replace('/\D+/', '', $dni) ?? '';

        if (strlen($dni) !== 8) {
            throw new RuntimeException(__('El DNI debe tener 8 dígitos.'));
        }

        $cacheKey = "almapet:documento:dni:{$dni}";

        return Cache::remember($cacheKey, now()->addDays(30), function () use ($dni): array {
            return $this->fetchFromApiPeru($dni);
        });
    }

    /**
     * @return array{
     *     dni: string,
     *     name: string,
     *     lastname: string,
     *     full_name: string,
     * }
     */
    private function fetchFromApiPeru(string $dni): array
    {
        $response = ApiPeruHttp::client()->post('/dni', ['dni' => $dni]);

        ApiPeruHttp::assertSuccessful($response);

        $json = $response->json();
        if (! is_array($json) || ! ($json['success'] ?? false)) {
            $msg = is_string($json['message'] ?? null)
                ? $json['message']
                : __('No se encontraron datos para el DNI indicado.');

            throw new ApiPeruConsultaException($msg, 422, 'not_found');
        }

        $data = $json['data'] ?? null;
        if (! is_array($data)) {
            throw new ApiPeruConsultaException(
                __('Respuesta de API DNI inválida.'),
                422,
                'invalid_response',
            );
        }

        $nombres = trim((string) ($data['nombres'] ?? ''));
        $paterno = trim((string) ($data['apellido_paterno'] ?? ''));
        $materno = trim((string) ($data['apellido_materno'] ?? ''));
        $apellidos = trim($paterno.' '.$materno);
        $nombreCompleto = trim((string) ($data['nombre_completo'] ?? ''));

        if ($nombres === '' && $nombreCompleto !== '') {
            $nombres = $nombreCompleto;
        }

        if ($nombres === '' && $apellidos === '' && $nombreCompleto === '') {
            throw new ApiPeruConsultaException(
                __('La API no devolvió nombres para este DNI.'),
                422,
                'empty_data',
            );
        }

        return [
            'dni' => $dni,
            'name' => mb_substr($nombres !== '' ? $nombres : $nombreCompleto, 0, 120),
            'lastname' => mb_substr($apellidos, 0, 120),
            'full_name' => mb_substr(
                $nombreCompleto !== '' ? $nombreCompleto : trim($nombres.' '.$apellidos),
                0,
                255,
            ),
        ];
    }
}
