<?php

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Models\Animal;
use App\Models\ChipRegistration;
use App\Models\Owner;
use App\Support\DateRange;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Clientes (titulares) con sus mascotas / chips registrados.
 */
final class PlatformClientController extends Controller
{
    private const PER_PAGE_OPTIONS = [10, 15, 20, 25, 50];

    public function index(Request $request): Response
    {
        $search = trim((string) $request->string('search', ''));
        $perPageRequested = (int) $request->integer('per_page', 10);
        $perPage = in_array($perPageRequested, self::PER_PAGE_OPTIONS, true)
            ? $perPageRequested
            : 10;

        $range = DateRange::resolve(
            $request->query('desde'),
            $request->query('hasta'),
        );

        $desde = $range['desde'];
        $hasta = $range['hasta'];

        $inRange = function (Builder $chip) use ($desde, $hasta): void {
            $chip->whereBetween(
                DB::raw('DATE(COALESCE(registered_at, created_at))'),
                [$desde, $hasta],
            );
        };

        $clients = Owner::query()
            ->select('owners.*')
            ->selectSub(
                ChipRegistration::query()
                    ->selectRaw('MAX(COALESCE(chip_registrations.registered_at, chip_registrations.created_at))')
                    ->join('animals', 'animals.id', '=', 'chip_registrations.animal_id')
                    ->whereColumn('animals.owner_id', 'owners.id'),
                'last_registration_at',
            )
            ->with([
                'animals' => function ($q) use ($inRange): void {
                    $q->with(['chipRegistration.organization:id,name,ruc'])
                        ->whereHas('chipRegistration', $inRange)
                        ->orderBy('name');
                },
            ])
            ->whereHas('animals.chipRegistration', $inRange)
            ->when($search !== '', function (Builder $q) use ($search): void {
                $q->where(function (Builder $inner) use ($search): void {
                    $inner->where('name', 'like', "%{$search}%")
                        ->orWhere('lastname', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('document_number', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhereHas('animals', function (Builder $animal) use ($search): void {
                            $animal->where('name', 'like', "%{$search}%")
                                ->orWhereHas('chipRegistration', function (Builder $chip) use ($search): void {
                                    $chip->where('microchip', 'like', "%{$search}%")
                                        ->orWhere('public_code', 'like', "%{$search}%");
                                });
                        });
                });
            })
            ->orderByDesc('last_registration_at')
            ->orderBy('lastname')
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString();

        $clients->getCollection()->transform(function (Owner $owner): array {
            $pets = $owner->animals->map(function (Animal $animal): array {
                $chip = $animal->chipRegistration;

                return [
                    'id' => $animal->id,
                    'name' => $animal->name,
                    'species' => $animal->species,
                    'breed' => $animal->breed,
                    'sex' => $animal->sex,
                    'chip' => $chip ? [
                        'id' => $chip->id,
                        'microchip' => $chip->microchip,
                        'public_code' => $chip->public_code,
                        'status' => $chip->status,
                        'certificate_code' => $chip->certificate_code,
                        'registered_at' => $chip->registered_at?->toIso8601String(),
                        'created_at' => $chip->created_at?->toIso8601String(),
                        'clinic' => $chip->organization ? [
                            'id' => $chip->organization->id,
                            'name' => $chip->organization->name,
                            'ruc' => $chip->organization->ruc,
                        ] : null,
                    ] : null,
                ];
            })->values()->all();

            return [
                'id' => $owner->id,
                'name' => $owner->name,
                'lastname' => $owner->lastname,
                'full_name' => $owner->fullName(),
                'document_type' => $owner->document_type instanceof \BackedEnum
                    ? $owner->document_type->value
                    : (string) ($owner->document_type ?? ''),
                'document_number' => $owner->document_number,
                'email' => $owner->email,
                'phone' => $owner->phone,
                'pets_count' => count($pets),
                'pets' => $pets,
                'last_registration_at' => $owner->getAttribute('last_registration_at'),
            ];
        });

        $ownersInRange = Owner::query()
            ->whereHas('animals.chipRegistration', $inRange)
            ->count();

        $petsInRange = ChipRegistration::query()
            ->whereBetween(
                DB::raw('DATE(COALESCE(registered_at, created_at))'),
                [$desde, $hasta],
            )
            ->count();

        $activeInRange = ChipRegistration::query()
            ->where('status', ChipRegistration::STATUS_ACTIVE)
            ->whereBetween(
                DB::raw('DATE(COALESCE(registered_at, created_at))'),
                [$desde, $hasta],
            )
            ->count();

        return Inertia::render('platform/clients/index', [
            'clients' => $clients,
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
                'desde' => $desde,
                'hasta' => $hasta,
            ],
            'date_defaults' => [
                'desde' => $range['default_desde'],
                'hasta' => $range['default_hasta'],
            ],
            'stats' => [
                'clients' => $ownersInRange,
                'pets' => $petsInRange,
                'active' => $activeInRange,
                'coincidencias' => $clients->total(),
            ],
        ]);
    }
}
