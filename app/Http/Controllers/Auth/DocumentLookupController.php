<?php

namespace App\Http\Controllers\Auth;

use App\Exceptions\ApiPeruConsultaException;
use App\Http\Controllers\Controller;
use App\Services\Integrations\ApiPeruDniService;
use App\Services\Integrations\ApiPeruRucService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;
use Throwable;

class DocumentLookupController extends Controller
{
    public function dni(Request $request, ApiPeruDniService $apiPeru): JsonResponse
    {
        $dni = preg_replace('/\D+/', '', (string) $request->query('dni', '')) ?? '';
        $request->merge(['dni' => $dni]);

        $validated = $request->validate([
            'dni' => ['required', 'string', 'regex:/^[0-9]{8}$/'],
        ]);

        try {
            $data = $apiPeru->consultar($validated['dni']);

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (ApiPeruConsultaException $e) {
            return $e->toJsonResponse();
        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'code' => 'validation',
            ], 422);
        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'message' => __('No se pudo consultar el DNI. Intenta de nuevo.'),
                'code' => 'unexpected',
            ], 503);
        }
    }

    public function ruc(Request $request, ApiPeruRucService $apiPeru): JsonResponse
    {
        $ruc = preg_replace('/\D+/', '', (string) $request->query('ruc', '')) ?? '';
        $request->merge(['ruc' => $ruc]);

        $validated = $request->validate([
            'ruc' => ['required', 'string', 'regex:/^[0-9]{11}$/'],
        ]);

        try {
            $data = $apiPeru->consultar($validated['ruc']);

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (ApiPeruConsultaException $e) {
            return $e->toJsonResponse();
        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'code' => 'validation',
            ], 422);
        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'message' => __('No se pudo consultar el RUC. Intenta de nuevo.'),
                'code' => 'unexpected',
            ], 503);
        }
    }
}
