<?php

namespace App\Http\Controllers;

use App\Models\CatalogSuggestion;
use App\Services\Catalog\CatalogSuggestionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CatalogSuggestionController extends Controller
{
    public function store(Request $request, CatalogSuggestionService $service): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 403);

        $data = $request->validate([
            'type' => ['required', 'in:species,breed'],
            'name' => ['required', 'string', 'max:120'],
            'species_id' => ['nullable', 'integer', 'exists:species,id'],
        ]);

        if ($data['type'] === CatalogSuggestion::TYPE_SPECIES) {
            $suggestion = $service->suggestSpecies($user, $data['name']);
            $catalogCreated = [
                'type' => 'species',
                'species_id' => $suggestion->created_species_id,
                'breed_id' => null,
            ];
        } else {
            if (empty($data['species_id'])) {
                return back()->with('error', 'Selecciona una especie para sugerir la raza.');
            }
            $suggestion = $service->suggestBreed($user, (int) $data['species_id'], $data['name']);
            $catalogCreated = [
                'type' => 'breed',
                'species_id' => $suggestion->species_id,
                'breed_id' => $suggestion->created_breed_id,
            ];
        }

        return back()
            ->with(
                'success',
                'Listo: ya puedes usarla. Un administrador revisará la solicitud.',
            )
            ->with('catalog_created', $catalogCreated);
    }
}
