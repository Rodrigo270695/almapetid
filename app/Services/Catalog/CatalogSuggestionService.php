<?php

namespace App\Services\Catalog;

use App\Models\Breed;
use App\Models\CatalogSuggestion;
use App\Models\Species;
use App\Models\User;
use App\Services\Push\PushNotificationService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class CatalogSuggestionService
{
    public function __construct(
        private readonly PushNotificationService $push,
    ) {}

    public function suggestSpecies(User $user, string $name): CatalogSuggestion
    {
        $name = trim($name);
        if ($name === '') {
            throw ValidationException::withMessages(['name' => 'Ingresa un nombre de especie.']);
        }

        $exists = Species::query()
            ->whereRaw('lower(name) = ?', [mb_strtolower($name)])
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'name' => 'Esa especie ya existe en el catálogo.',
            ]);
        }

        $pending = CatalogSuggestion::query()
            ->where('type', CatalogSuggestion::TYPE_SPECIES)
            ->where('status', CatalogSuggestion::STATUS_PENDING)
            ->whereRaw('lower(name) = ?', [mb_strtolower($name)])
            ->exists();

        if ($pending) {
            throw ValidationException::withMessages([
                'name' => 'Ya hay una solicitud pendiente para esa especie.',
            ]);
        }

        $suggestion = DB::transaction(function () use ($user, $name): CatalogSuggestion {
            $species = Species::query()->create([
                'name' => $name,
                'slug' => Species::makeSlug($name),
                'active' => true,
                'sort_order' => ((int) Species::query()->max('sort_order')) + 1,
            ]);

            return CatalogSuggestion::query()->create([
                'type' => CatalogSuggestion::TYPE_SPECIES,
                'name' => $name,
                'status' => CatalogSuggestion::STATUS_PENDING,
                'requested_by_user_id' => $user->id,
                'created_species_id' => $species->id,
            ]);
        });

        $this->push->notifyCatalogSuggestion($suggestion, $user);

        return $suggestion->fresh(['createdSpecies', 'requestedBy']);
    }

    public function suggestBreed(User $user, int $speciesId, string $name): CatalogSuggestion
    {
        $name = trim($name);
        if ($name === '') {
            throw ValidationException::withMessages(['name' => 'Ingresa un nombre de raza.']);
        }

        $species = Species::query()->whereKey($speciesId)->where('active', true)->first();
        if ($species === null) {
            throw ValidationException::withMessages(['species_id' => 'Selecciona una especie válida.']);
        }

        $exists = Breed::query()
            ->where('species_id', $species->id)
            ->whereRaw('lower(name) = ?', [mb_strtolower($name)])
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'name' => 'Esa raza ya existe para esta especie.',
            ]);
        }

        $pending = CatalogSuggestion::query()
            ->where('type', CatalogSuggestion::TYPE_BREED)
            ->where('species_id', $species->id)
            ->where('status', CatalogSuggestion::STATUS_PENDING)
            ->whereRaw('lower(name) = ?', [mb_strtolower($name)])
            ->exists();

        if ($pending) {
            throw ValidationException::withMessages([
                'name' => 'Ya hay una solicitud pendiente para esa raza.',
            ]);
        }

        $suggestion = DB::transaction(function () use ($user, $species, $name): CatalogSuggestion {
            $breed = Breed::query()->create([
                'species_id' => $species->id,
                'name' => $name,
                'active' => true,
                'sort_order' => ((int) Breed::query()
                    ->where('species_id', $species->id)
                    ->max('sort_order')) + 1,
            ]);

            return CatalogSuggestion::query()->create([
                'type' => CatalogSuggestion::TYPE_BREED,
                'name' => $name,
                'species_id' => $species->id,
                'status' => CatalogSuggestion::STATUS_PENDING,
                'requested_by_user_id' => $user->id,
                'created_breed_id' => $breed->id,
            ]);
        });

        $this->push->notifyCatalogSuggestion($suggestion, $user);

        return $suggestion->fresh(['createdBreed', 'species', 'requestedBy']);
    }

    public function approve(CatalogSuggestion $suggestion, User $reviewer, ?string $notes = null): Species|Breed
    {
        if ($suggestion->status !== CatalogSuggestion::STATUS_PENDING) {
            throw ValidationException::withMessages([
                'suggestion' => 'Esta solicitud ya fue revisada.',
            ]);
        }

        $created = DB::transaction(function () use ($suggestion, $reviewer, $notes): Species|Breed {
            if ($suggestion->type === CatalogSuggestion::TYPE_SPECIES) {
                $entity = $suggestion->created_species_id
                    ? Species::query()->findOrFail($suggestion->created_species_id)
                    : Species::query()->create([
                        'name' => $suggestion->name,
                        'slug' => Species::makeSlug($suggestion->name),
                        'active' => true,
                        'sort_order' => ((int) Species::query()->max('sort_order')) + 1,
                    ]);

                if (! $entity->active) {
                    $entity->update(['active' => true]);
                }
            } else {
                if ($suggestion->species_id === null) {
                    throw ValidationException::withMessages([
                        'species_id' => 'La solicitud de raza no tiene especie.',
                    ]);
                }

                $entity = $suggestion->created_breed_id
                    ? Breed::query()->findOrFail($suggestion->created_breed_id)
                    : Breed::query()->create([
                        'species_id' => $suggestion->species_id,
                        'name' => $suggestion->name,
                        'active' => true,
                        'sort_order' => ((int) Breed::query()
                            ->where('species_id', $suggestion->species_id)
                            ->max('sort_order')) + 1,
                    ]);

                if (! $entity->active) {
                    $entity->update(['active' => true]);
                }
            }

            $suggestion->update([
                'status' => CatalogSuggestion::STATUS_APPROVED,
                'reviewed_by_user_id' => $reviewer->id,
                'reviewed_at' => now(),
                'review_notes' => $notes,
                'created_species_id' => $suggestion->type === CatalogSuggestion::TYPE_SPECIES
                    ? $entity->id
                    : $suggestion->created_species_id,
                'created_breed_id' => $suggestion->type === CatalogSuggestion::TYPE_BREED
                    ? $entity->id
                    : $suggestion->created_breed_id,
            ]);

            return $entity;
        });

        $this->push->notifyCatalogDecision($suggestion->fresh(['requestedBy', 'species']), 'approved');

        return $created;
    }

    public function reject(CatalogSuggestion $suggestion, User $reviewer, ?string $notes = null): void
    {
        if ($suggestion->status !== CatalogSuggestion::STATUS_PENDING) {
            throw ValidationException::withMessages([
                'suggestion' => 'Esta solicitud ya fue revisada.',
            ]);
        }

        DB::transaction(function () use ($suggestion, $reviewer, $notes): void {
            if ($suggestion->created_species_id) {
                Species::query()
                    ->whereKey($suggestion->created_species_id)
                    ->update(['active' => false]);
            }

            if ($suggestion->created_breed_id) {
                Breed::query()
                    ->whereKey($suggestion->created_breed_id)
                    ->update(['active' => false]);
            }

            $suggestion->update([
                'status' => CatalogSuggestion::STATUS_REJECTED,
                'reviewed_by_user_id' => $reviewer->id,
                'reviewed_at' => now(),
                'review_notes' => $notes,
            ]);
        });

        $this->push->notifyCatalogDecision($suggestion->fresh(['requestedBy', 'species']), 'rejected');
    }
}
