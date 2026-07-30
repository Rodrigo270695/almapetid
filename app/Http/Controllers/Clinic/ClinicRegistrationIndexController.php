<?php

namespace App\Http\Controllers\Clinic;

use App\Http\Controllers\Controller;
use App\Models\ChipRegistration;
use App\Services\Clinics\ClinicOwnerActivationNotifier;
use App\Support\Geo\GeoCatalog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ClinicRegistrationIndexController extends Controller
{
    public function __invoke(
        Request $request,
        ClinicOwnerActivationNotifier $notifier,
    ): Response {
        $user = $request->user();
        abort_unless($user !== null, 403);

        $organization = $user->primaryOrganization();
        abort_unless($organization !== null, 404);

        $search = trim((string) $request->string('search', ''));

        $query = ChipRegistration::query()
            ->where('organization_id', $organization->id)
            ->with(['animal.owner']);

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('microchip', 'ILIKE', "%{$search}%")
                    ->orWhere('public_code', 'ILIKE', "%{$search}%")
                    ->orWhereHas('animal', function ($aq) use ($search) {
                        $aq->where('name', 'ILIKE', "%{$search}%");
                    })
                    ->orWhereHas('animal.owner', function ($oq) use ($search) {
                        $oq->where('document_number', 'ILIKE', "%{$search}%")
                            ->orWhere('name', 'ILIKE', "%{$search}%")
                            ->orWhere('lastname', 'ILIKE', "%{$search}%");
                    });
            });
        }

        $digitalAmount = (float) config('almapet.clinic_external_digital_amount', 20);
        $physicalAmount = (float) config('almapet.physical_carnet_amount', 30);

        $registrations = $query
            ->latest('id')
            ->paginate(15)
            ->withQueryString()
            ->through(function (ChipRegistration $chip) use ($notifier): array {
                $whatsappUrl = $chip->isPendingPayment()
                    ? $notifier->ownerWhatsAppUrl($chip)
                    : null;

                return [
                    'id' => $chip->id,
                    'microchip' => $chip->microchip,
                    'public_code' => $chip->public_code,
                    'certificate_code' => $chip->certificate_code,
                    'status' => $chip->status,
                    'registered_at' => $chip->registered_at?->toIso8601String(),
                    'activate_url' => $chip->isPendingPayment()
                        ? url('/activar/'.$chip->public_code)
                        : null,
                    'whatsapp_url' => $whatsappUrl,
                    'animal' => [
                        'id' => $chip->animal?->id,
                        'name' => $chip->animal?->name,
                        'species' => $chip->animal?->species,
                        'breed' => $chip->animal?->breed,
                    ],
                    'owner' => [
                        'name' => $chip->animal?->owner?->fullName(),
                        'document_number' => $chip->animal?->owner?->document_number,
                        'phone' => $chip->animal?->owner?->phone,
                    ],
                ];
            });

        return Inertia::render('clinic/registrations/index', [
            'organization' => [
                'id' => $organization->id,
                'name' => $organization->name,
            ],
            'registrations' => $registrations,
            'filters' => [
                'search' => $search,
            ],
            'pricing' => [
                'digital_amount' => $digitalAmount,
                'physical_amount' => $physicalAmount,
            ],
            'culqi_ready' => trim((string) config('culqi.public_key')) !== ''
                && trim((string) config('culqi.secret_key')) !== '',
            'can_declare_lost' => $user->can('lost.declare'),
            'can_recover' => $user->can('lost.recover'),
            'departamentos' => GeoCatalog::departamentosPeru(),
            'flash_whatsapp_url' => $request->session()->get('whatsapp_url'),
        ]);
    }
}
