<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\Integrations\HandoffTokenService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class HandoffApiController extends Controller
{
    /**
     * VetSaaS solicita un token one-time para redirigir al staff/dueño.
     */
    public function store(Request $request, HandoffTokenService $handoff): JsonResponse
    {
        $data = $request->validate([
            'vetsaas_tenant_id' => ['required', 'string', 'max:36'],
            'vetsaas_slug' => ['required', 'string', 'max:80'],
            'vetsaas_paciente_id' => ['required', 'string', 'max:36'],
            'microchip' => ['required', 'string', 'max:32'],
            'country_code' => ['nullable', 'string', 'size:2'],
            'implant_date' => ['nullable', 'date'],
            'implant_site' => ['nullable', 'string', 'max:120'],
            'clinic' => ['required', 'array'],
            'clinic.name' => ['required', 'string', 'max:200'],
            'clinic.ruc' => ['nullable', 'string', 'max:20'],
            'clinic.email' => ['nullable', 'email', 'max:190'],
            'clinic.phone' => ['nullable', 'string', 'max:40'],
            'clinic.address' => ['nullable', 'string', 'max:255'],
            'clinic.city' => ['nullable', 'string', 'max:120'],
            'owner' => ['required', 'array'],
            'owner.document_type' => ['nullable', 'string', 'max:40'],
            'owner.document_number' => ['nullable', 'string', 'max:40'],
            'owner.name' => ['nullable', 'string', 'max:120'],
            'owner.lastname' => ['nullable', 'string', 'max:120'],
            'owner.full_name' => ['nullable', 'string', 'max:200'],
            'owner.email' => ['nullable', 'email', 'max:190'],
            'owner.phone' => ['nullable', 'string', 'max:40'],
            'animal' => ['required', 'array'],
            'animal.name' => ['required', 'string', 'max:120'],
            'animal.species' => ['nullable', 'string', 'max:80'],
            'animal.breed' => ['nullable', 'string', 'max:120'],
            'animal.sex' => ['nullable', 'string', 'max:20'],
            'animal.color' => ['nullable', 'string', 'max:80'],
            'animal.birth_date' => ['nullable', 'date'],
            'animal.notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $issued = $handoff->issue($data);

        return response()->json($issued, 201);
    }
}
