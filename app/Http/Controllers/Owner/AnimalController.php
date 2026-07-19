<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Animal;
use App\Models\Breed;
use App\Models\Plan;
use App\Models\RegistrationPayment;
use App\Models\Species;
use App\Services\Owners\OwnerAnimalRegistrationService;
use App\Services\Owners\OwnerClaimService;
use App\Services\Payments\RegistrationPaymentService;
use App\Support\Auth\HomePath;
use App\Support\Geo\GeoCatalog;
use App\Support\Geo\LocationHydrator;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class AnimalController extends Controller
{
    public function index(Request $request, OwnerClaimService $claim): Response|RedirectResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 403);

        if ($user->isClinicUser()) {
            return redirect()->to(HomePath::for($user));
        }

        $owner = $claim->claimForUser($user) ?? $user->ownerProfile;

        $animals = [];
        if ($owner !== null) {
            $animals = $owner->animals()
                ->with(['chipRegistration.organization'])
                ->latest()
                ->get()
                ->map(fn (Animal $animal): array => $this->mapAnimalSummary($animal))
                ->all();
        }

        $unusedPayment = app(RegistrationPaymentService::class)
            ->findConsumablePaidForUser($user);

        return Inertia::render('animals/index', [
            'owner' => $owner ? [
                'name' => $owner->fullName(),
                'document_number' => $owner->document_number,
            ] : null,
            'animals' => $animals,
            'has_unused_payment' => $unusedPayment !== null,
            'unused_payment_id' => $unusedPayment?->id,
            'culqi_enabled' => $this->culqiEnabled(),
        ]);
    }

    public function register(Request $request): Response|RedirectResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 403);

        if ($user->isClinicUser()) {
            return redirect()->to(HomePath::for($user));
        }

        $unused = app(RegistrationPaymentService::class)->findConsumablePaidForUser($user);
        if ($unused !== null) {
            return redirect()->route('animals.create', ['payment_id' => $unused->id]);
        }

        $plans = Plan::query()
            ->where('active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'code', 'name', 'description', 'billing_period', 'amount', 'currency', 'is_default']);

        return Inertia::render('animals/register', [
            'plans' => $plans,
            'culqi_enabled' => $this->culqiEnabled(),
        ]);
    }

    public function create(
        Request $request,
        RegistrationPaymentService $payments,
    ): Response|RedirectResponse {
        $user = $request->user();
        abort_unless($user !== null, 403);

        if ($user->isClinicUser()) {
            return redirect()->to(HomePath::for($user));
        }

        $paymentId = $request->integer('payment_id') ?: null;
        $payment = $payments->findConsumablePaidForUser($user, $paymentId);

        if ($payment === null) {
            return redirect()
                ->route('animals.register')
                ->with('info', 'Primero elige un plan y completa el pago.');
        }

        $payment->load('plan:id,name,code');

        return Inertia::render('animals/create', [
            'payment' => [
                'id' => $payment->id,
                'amount' => (float) $payment->amount,
                'currency' => $payment->currency,
                'plan_name' => $payment->plan?->name,
                'paid_at' => $payment->paid_at?->toIso8601String(),
            ],
            'species_catalog' => $this->speciesCatalog(),
        ]);
    }

    public function store(
        Request $request,
        OwnerAnimalRegistrationService $registrations,
    ): RedirectResponse {
        $user = $request->user();
        abort_unless($user !== null, 403);

        if ($user->isClinicUser()) {
            return redirect()->to(HomePath::for($user));
        }

        $data = $request->validate([
            'payment_id' => ['required', 'integer', 'exists:registration_payments,id'],
            'name' => ['required', 'string', 'max:120'],
            'species_id' => ['required', 'integer', 'exists:species,id'],
            'breed_id' => ['nullable', 'integer', 'exists:breeds,id'],
            'sex' => ['nullable', 'string', 'max:32'],
            'color' => ['nullable', 'string', 'max:80'],
            'birth_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'photo' => ['nullable', 'image', 'max:5120'],
            'microchip' => ['required', 'string', 'max:32', 'regex:/^\d{9,20}$/'],
            'implant_date' => ['nullable', 'date'],
            'implant_site' => ['nullable', 'string', 'max:120'],
        ]);

        [$speciesName, $breedName] = $this->resolveSpeciesBreedNames(
            (int) $data['species_id'],
            isset($data['breed_id']) ? (int) $data['breed_id'] : null,
        );

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('animals', 'public');
        }

        $payload = [
            'name' => $data['name'],
            'species' => $speciesName,
            'breed' => $breedName,
            'sex' => $data['sex'] ?? null,
            'color' => $data['color'] ?? null,
            'birth_date' => $data['birth_date'] ?? null,
            'notes' => $data['notes'] ?? null,
            'photo_path' => $photoPath,
            'microchip' => $data['microchip'],
            'implant_date' => $data['implant_date'] ?? null,
            'implant_site' => $data['implant_site'] ?? null,
        ];

        $payment = RegistrationPayment::query()->findOrFail($data['payment_id']);
        $chip = $registrations->registerWithPaidPayment($user, $payment, $payload);

        return redirect()
            ->route('animals.show', $chip->animal_id)
            ->with('success', 'Mascota registrada correctamente en AlmaPet ID.');
    }

    public function show(Request $request, Animal $animal, OwnerClaimService $claim): Response|RedirectResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 403);

        if ($user->isClinicUser()) {
            return redirect()->to(HomePath::for($user));
        }

        $this->assertOwnsAnimal($user, $animal, $claim);
        $animal->load([
            'chipRegistration.organization',
            'chipRegistration.openLostReport',
            'chipRegistration.lostReports' => fn ($q) => $q->latest('lost_at')->limit(50),
            'chipRegistration.foundReports' => fn ($q) => $q->latest()->limit(20),
            'owner',
        ]);

        $chip = $animal->chipRegistration;
        $openLost = $chip?->openLostReport;
        $canDeclare = $user->can('lost.declare') && $chip !== null && $chip->isActive();
        $canRecover = $user->can('lost.recover') && $chip !== null && $chip->isLost();

        $ownerLocation = LocationHydrator::fromDistritoId(
            $animal->owner?->distrito_id !== null
                ? (int) $animal->owner->distrito_id
                : null,
        );

        return Inertia::render('animals/show', [
            'animal' => $this->mapAnimalDetail($animal),
            'can_update' => $user->can('animals.update'),
            'can_declare_lost' => $canDeclare,
            'can_recover' => $canRecover,
            'departamentos' => GeoCatalog::departamentosPeru(),
            'owner_geo' => $ownerLocation ? [
                'departamento_id' => $ownerLocation['departamento_id'],
                'provincia_id' => $ownerLocation['provincia_id'],
                'distrito_id' => $ownerLocation['distrito_id'],
            ] : null,
            'lost_report' => $openLost ? [
                'id' => $openLost->id,
                'status' => $openLost->status,
                'lost_at' => $openLost->lost_at?->toIso8601String(),
                'last_seen_zone' => $openLost->last_seen_zone,
                'last_seen_city' => $openLost->last_seen_city,
                'departamento' => $openLost->departamento,
                'provincia' => $openLost->provincia,
                'distrito' => $openLost->distrito,
                'public_notes' => $openLost->public_notes,
                'photo_url' => $openLost->photoUrl(),
            ] : null,
            'lost_history' => $chip
                ? $chip->lostReports->map(fn ($report) => [
                    'id' => $report->id,
                    'status' => $report->status,
                    'lost_at' => $report->lost_at?->toIso8601String(),
                    'recovered_at' => $report->recovered_at?->toIso8601String(),
                    'departamento' => $report->departamento,
                    'provincia' => $report->provincia,
                    'distrito' => $report->distrito,
                    'last_seen_city' => $report->last_seen_city,
                    'last_seen_zone' => $report->last_seen_zone,
                    'public_notes' => $report->public_notes,
                ])->values()->all()
                : [],
            'found_reports' => $chip
                ? $chip->foundReports->map(fn ($report) => [
                    'id' => $report->id,
                    'reporter_name' => $report->reporter_name,
                    'reporter_phone' => $report->reporter_phone,
                    'reporter_email' => $report->reporter_email,
                    'message' => $report->message,
                    'city' => $report->city,
                    'zone' => $report->zone,
                    'created_at' => $report->created_at?->toIso8601String(),
                ])->values()->all()
                : [],
            'public_profile_url' => $chip
                ? url('/p/'.$chip->public_code)
                : null,
        ]);
    }

    public function edit(Request $request, Animal $animal, OwnerClaimService $claim): Response|RedirectResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 403);

        if ($user->isClinicUser()) {
            return redirect()->to(HomePath::for($user));
        }

        $this->assertOwnsAnimal($user, $animal, $claim);

        $catalog = $this->speciesCatalog();
        $speciesId = null;
        $breedId = null;

        foreach ($catalog as $species) {
            if (mb_strtolower((string) $species['name']) === mb_strtolower((string) $animal->species)) {
                $speciesId = $species['id'];
                foreach ($species['breeds'] as $breed) {
                    if (
                        $animal->breed !== null
                        && mb_strtolower((string) $breed['name']) === mb_strtolower((string) $animal->breed)
                    ) {
                        $breedId = $breed['id'];
                        break;
                    }
                }
                break;
            }
        }

        return Inertia::render('animals/edit', [
            'animal' => [
                'id' => $animal->id,
                'name' => $animal->name,
                'species_id' => $speciesId,
                'breed_id' => $breedId,
                'sex' => $animal->sex,
                'color' => $animal->color,
                'birth_date' => $animal->birth_date?->toDateString(),
                'notes' => $animal->notes,
                'photo_url' => $animal->photoUrl(),
            ],
            'species_catalog' => $catalog,
        ]);
    }

    public function update(
        Request $request,
        Animal $animal,
        OwnerClaimService $claim,
    ): RedirectResponse {
        $user = $request->user();
        abort_unless($user !== null, 403);

        if ($user->isClinicUser()) {
            return redirect()->to(HomePath::for($user));
        }

        $this->assertOwnsAnimal($user, $animal, $claim);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'species_id' => ['required', 'integer', 'exists:species,id'],
            'breed_id' => ['nullable', 'integer', 'exists:breeds,id'],
            'sex' => ['nullable', 'string', 'max:32'],
            'color' => ['nullable', 'string', 'max:80'],
            'birth_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'photo' => ['nullable', 'image', 'max:5120'],
            'remove_photo' => ['sometimes', 'boolean'],
        ]);

        [$speciesName, $breedName] = $this->resolveSpeciesBreedNames(
            (int) $data['species_id'],
            isset($data['breed_id']) ? (int) $data['breed_id'] : null,
        );

        $photoPath = $animal->photo_path;

        if ($request->boolean('remove_photo') && $photoPath) {
            Storage::disk('public')->delete($photoPath);
            $photoPath = null;
        }

        if ($request->hasFile('photo')) {
            if ($animal->photo_path) {
                Storage::disk('public')->delete($animal->photo_path);
            }
            $photoPath = $request->file('photo')->store('animals', 'public');
        }

        $animal->update([
            'name' => $data['name'],
            'species' => $speciesName,
            'breed' => $breedName,
            'sex' => $data['sex'] ?? null,
            'color' => $data['color'] ?? null,
            'birth_date' => $data['birth_date'] ?? null,
            'notes' => $data['notes'] ?? null,
            'photo_path' => $photoPath,
        ]);

        return redirect()
            ->route('animals.show', $animal)
            ->with('success', 'Datos de la mascota actualizados.');
    }

    /**
     * @return array<string, mixed>
     */
    private function mapAnimalSummary(Animal $animal): array
    {
        return [
            'id' => $animal->id,
            'name' => $animal->name,
            'species' => $animal->species,
            'breed' => $animal->breed,
            'sex' => $animal->sex,
            'color' => $animal->color,
            'photo_url' => $animal->photoUrl(),
            'chip' => $animal->chipRegistration ? [
                'microchip' => $animal->chipRegistration->microchip,
                'public_code' => $animal->chipRegistration->public_code,
                'status' => $animal->chipRegistration->status,
                'registered_at' => $animal->chipRegistration->registered_at?->toIso8601String(),
                'organization' => $animal->chipRegistration->organization ? [
                    'name' => $animal->chipRegistration->organization->name,
                    'ruc' => $animal->chipRegistration->organization->ruc,
                ] : null,
            ] : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function mapAnimalDetail(Animal $animal): array
    {
        return [
            'id' => $animal->id,
            'name' => $animal->name,
            'species' => $animal->species,
            'breed' => $animal->breed,
            'sex' => $animal->sex,
            'color' => $animal->color,
            'birth_date' => $animal->birth_date?->toDateString(),
            'notes' => $animal->notes,
            'photo_url' => $animal->photoUrl(),
            'created_at' => $animal->created_at?->toIso8601String(),
            'owner' => [
                'name' => $animal->owner->fullName(),
                'document_type' => $animal->owner->document_type?->value ?? $animal->owner->document_type,
                'document_number' => $animal->owner->document_number,
                'phone' => $animal->owner->phone,
                'email' => $animal->owner->email,
            ],
            'chip' => $animal->chipRegistration ? [
                'id' => $animal->chipRegistration->id,
                'microchip' => $animal->chipRegistration->microchip,
                'public_code' => $animal->chipRegistration->public_code,
                'certificate_code' => $animal->chipRegistration->certificate_code,
                'status' => $animal->chipRegistration->status,
                'registered_at' => $animal->chipRegistration->registered_at?->toIso8601String(),
                'implant_date' => $animal->chipRegistration->implant_date?->toDateString(),
                'implant_site' => $animal->chipRegistration->implant_site,
                'country_code' => $animal->chipRegistration->country_code,
                'organization' => $animal->chipRegistration->organization ? [
                    'id' => $animal->chipRegistration->organization->id,
                    'name' => $animal->chipRegistration->organization->name,
                    'ruc' => $animal->chipRegistration->organization->ruc,
                    'city' => $animal->chipRegistration->organization->city,
                    'contact_phone' => $animal->chipRegistration->organization->contact_phone,
                ] : null,
            ] : null,
        ];
    }

    /**
     * @return list<array{id: int, name: string, breeds: list<array{id: int, name: string}>}>
     */
    private function speciesCatalog(): array
    {
        return Species::query()
            ->where('active', true)
            ->with(['breeds' => fn ($q) => $q->where('active', true)->orderBy('sort_order')->orderBy('name')])
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name', 'slug'])
            ->map(fn (Species $s) => [
                'id' => $s->id,
                'name' => $s->name,
                'breeds' => $s->breeds->map(fn (Breed $b) => [
                    'id' => $b->id,
                    'name' => $b->name,
                ])->values()->all(),
            ])
            ->values()
            ->all();
    }

    /**
     * @return array{0: string, 1: string|null}
     */
    private function resolveSpeciesBreedNames(int $speciesId, ?int $breedId): array
    {
        $species = Species::query()->whereKey($speciesId)->where('active', true)->firstOrFail();
        $breedName = null;

        if ($breedId !== null) {
            $breed = Breed::query()
                ->whereKey($breedId)
                ->where('species_id', $species->id)
                ->where('active', true)
                ->firstOrFail();
            $breedName = $breed->name;
        }

        return [$species->name, $breedName];
    }

    private function assertOwnsAnimal($user, Animal $animal, OwnerClaimService $claim): void
    {
        $owner = $claim->claimForUser($user) ?? $user->ownerProfile;
        abort_unless($owner !== null, 404);
        abort_unless((int) $animal->owner_id === (int) $owner->id, 404);
    }

    private function culqiEnabled(): bool
    {
        return trim((string) config('culqi.public_key')) !== ''
            && trim((string) config('culqi.secret_key')) !== '';
    }
}
