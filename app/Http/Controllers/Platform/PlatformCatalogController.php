<?php

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Models\Breed;
use App\Models\CatalogSuggestion;
use App\Models\Species;
use App\Services\Catalog\CatalogSuggestionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PlatformCatalogController extends Controller
{
    public function index(Request $request): Response
    {
        $species = Species::query()
            ->with(['breeds' => fn ($q) => $q->orderBy('sort_order')->orderBy('name')])
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        $suggestions = CatalogSuggestion::query()
            ->with([
                'species:id,name',
                'requestedBy:id,name,lastname,email',
            ])
            ->where('status', CatalogSuggestion::STATUS_PENDING)
            ->latest()
            ->get();

        return Inertia::render('platform/catalog/index', [
            'species' => $species,
            'suggestions' => $suggestions,
            'stats' => [
                'species' => Species::query()->count(),
                'breeds' => Breed::query()->count(),
                'pending' => $suggestions->count(),
            ],
        ]);
    }

    public function storeSpecies(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120', 'unique:species,name'],
            'active' => ['sometimes', 'boolean'],
        ]);

        Species::query()->create([
            'name' => trim($data['name']),
            'slug' => Species::makeSlug($data['name']),
            'active' => $request->boolean('active', true),
            'sort_order' => ((int) Species::query()->max('sort_order')) + 1,
        ]);

        return back()->with('success', 'Especie creada.');
    }

    public function updateSpecies(Request $request, Species $species): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120', Rule::unique('species', 'name')->ignore($species->id)],
            'active' => ['sometimes', 'boolean'],
        ]);

        $species->update([
            'name' => trim($data['name']),
            'active' => $request->boolean('active', $species->active),
        ]);

        return back()->with('success', 'Especie actualizada.');
    }

    public function destroySpecies(Species $species): RedirectResponse
    {
        $species->delete();

        return back()->with('success', 'Especie eliminada.');
    }

    public function storeBreed(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'species_id' => ['required', 'integer', 'exists:species,id'],
            'name' => [
                'required',
                'string',
                'max:120',
                Rule::unique('breeds', 'name')->where(fn ($q) => $q->where('species_id', $request->integer('species_id'))),
            ],
            'active' => ['sometimes', 'boolean'],
        ]);

        Breed::query()->create([
            'species_id' => $data['species_id'],
            'name' => trim($data['name']),
            'active' => $request->boolean('active', true),
            'sort_order' => ((int) Breed::query()->where('species_id', $data['species_id'])->max('sort_order')) + 1,
        ]);

        return back()->with('success', 'Raza creada.');
    }

    public function updateBreed(Request $request, Breed $breed): RedirectResponse
    {
        $data = $request->validate([
            'name' => [
                'required',
                'string',
                'max:120',
                Rule::unique('breeds', 'name')
                    ->where(fn ($q) => $q->where('species_id', $breed->species_id))
                    ->ignore($breed->id),
            ],
            'active' => ['sometimes', 'boolean'],
        ]);

        $breed->update([
            'name' => trim($data['name']),
            'active' => $request->boolean('active', $breed->active),
        ]);

        return back()->with('success', 'Raza actualizada.');
    }

    public function destroyBreed(Breed $breed): RedirectResponse
    {
        $breed->delete();

        return back()->with('success', 'Raza eliminada.');
    }

    public function approveSuggestion(
        CatalogSuggestion $suggestion,
        CatalogSuggestionService $service,
        Request $request,
    ): RedirectResponse {
        $service->approve($suggestion, $request->user(), $request->string('review_notes')->toString() ?: null);

        return back()->with('success', 'Solicitud aprobada y agregada al catálogo.');
    }

    public function rejectSuggestion(
        CatalogSuggestion $suggestion,
        CatalogSuggestionService $service,
        Request $request,
    ): RedirectResponse {
        $service->reject($suggestion, $request->user(), $request->string('review_notes')->toString() ?: null);

        return back()->with('success', 'Solicitud rechazada.');
    }
}
