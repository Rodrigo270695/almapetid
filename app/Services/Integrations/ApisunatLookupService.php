<?php

namespace App\Services\Integrations;

use App\Exceptions\ApiPeruConsultaException;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Consulta DNI/RUC vía APISUNAT (Lucode) — respaldo si apiperu falla.
 *
 * @see https://docs.apisunat.pe/apis-de-apoyo
 */
final class ApisunatLookupService
{
    public function isConfigured(): bool
    {
        return trim((string) config('services.apisunat_lookup.token', '')) !== '';
    }

    /**
     * @return array{
     *     dni: string,
     *     name: string,
     *     lastname: string,
     *     full_name: string,
     * }
     */
    public function consultarDni(string $dni): array
    {
        $dni = preg_replace('/\D+/', '', $dni) ?? '';

        if (strlen($dni) !== 8) {
            throw new RuntimeException(__('El DNI debe tener 8 dígitos.'));
        }

        $json = $this->getJson("/person/dni/{$dni}");

        if (! ($json['success'] ?? false)) {
            $msg = is_string($json['message'] ?? null)
                ? $json['message']
                : __('No se encontraron datos para el DNI indicado.');

            throw new ApiPeruConsultaException($msg, 422, 'not_found');
        }

        $data = $this->extractPayload($json);
        $nombres = trim((string) ($data['nombres'] ?? ''));
        $paterno = trim((string) ($data['apellido_paterno'] ?? $data['apellidoPaterno'] ?? ''));
        $materno = trim((string) ($data['apellido_materno'] ?? $data['apellidoMaterno'] ?? ''));
        $apellidos = trim($paterno.' '.$materno);
        $nombreCompleto = trim((string) ($data['nombre_completo'] ?? $data['nombreCompleto'] ?? ''));

        if ($nombres === '' && $nombreCompleto !== '') {
            $partes = preg_split('/\s+/', $nombreCompleto) ?: [];
            if (count($partes) >= 3) {
                $nombres = implode(' ', array_slice($partes, 2));
                $paterno = $paterno !== '' ? $paterno : (string) ($partes[0] ?? '');
                $materno = $materno !== '' ? $materno : (string) ($partes[1] ?? '');
                $apellidos = trim($paterno.' '.$materno);
            } else {
                $nombres = $nombreCompleto;
            }
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

    /**
     * @return array{
     *     ruc: string,
     *     name: string,
     *     address: string|null,
     * }
     */
    public function consultarRuc(string $ruc): array
    {
        $ruc = preg_replace('/\D+/', '', $ruc) ?? '';

        if (strlen($ruc) !== 11) {
            throw new RuntimeException(__('El RUC debe tener 11 dígitos.'));
        }

        $json = $this->getJson("/business/ruc/{$ruc}");

        if (! ($json['success'] ?? false)) {
            $msg = is_string($json['message'] ?? null)
                ? $json['message']
                : __('No se encontraron datos para el RUC indicado.');

            throw new ApiPeruConsultaException($msg, 422, 'not_found');
        }

        $data = $this->extractPayload($json);
        $razon = trim((string) ($data['razon_social'] ?? $data['nombre_o_razon_social'] ?? ''));
        if ($razon === '') {
            throw new ApiPeruConsultaException(
                __('La API no devolvió razón social para este RUC.'),
                422,
                'empty_data',
            );
        }

        $direccion = $data['direccion_fiscal'] ?? $data['direccion_completa'] ?? $data['direccion'] ?? null;
        $direccion = is_string($direccion) && trim($direccion) !== '' ? trim($direccion) : null;

        return [
            'ruc' => $ruc,
            'name' => mb_substr($razon, 0, 255),
            'address' => $direccion,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function getJson(string $path): array
    {
        $token = trim((string) config('services.apisunat_lookup.token', ''));
        if ($token === '') {
            throw new ApiPeruConsultaException(
                __('La consulta de respaldo (APISUNAT) no está configurada.'),
                503,
                'not_configured',
            );
        }

        $base = rtrim((string) config('services.apisunat_lookup.base_url', 'https://dev.apisunat.pe/api/v1'), '/');

        try {
            $response = Http::timeout(25)
                ->acceptJson()
                ->withToken($token)
                ->get($base.$path);
        } catch (\Throwable $e) {
            throw new ApiPeruConsultaException(
                __('El servicio de consulta no está disponible.'),
                503,
                'service_unavailable',
                $e,
            );
        }

        if ($response->status() === 429) {
            throw new ApiPeruConsultaException(
                __('Se alcanzó el límite de consultas. Intenta más tarde.'),
                429,
                'rate_limit',
            );
        }

        if ($response->status() === 401) {
            throw new ApiPeruConsultaException(
                __('El token de consulta APISUNAT no es válido.'),
                503,
                'not_configured',
            );
        }

        if (! $response->successful()) {
            throw new ApiPeruConsultaException(
                __('No se pudo consultar el documento (código :status).', ['status' => $response->status()]),
                $response->status() >= 500 ? 503 : 422,
                'api_error',
            );
        }

        $json = $response->json();

        return is_array($json) ? $json : [];
    }

    /**
     * @param  array<string, mixed>  $json
     * @return array<string, mixed>
     */
    private function extractPayload(array $json): array
    {
        $data = $json['data'] ?? $json['result'] ?? $json;

        return is_array($data) ? $data : [];
    }
}
