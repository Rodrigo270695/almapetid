<?php

namespace App\Http\Controllers\Auth;

use App\Enums\DocumentType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\CompleteDocumentRequest;
use App\Services\Owners\OwnerClaimService;
use App\Support\Auth\HomePath;
use App\Support\Geo\GeoCatalog;
use App\Support\Geo\LocationHydrator;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class DocumentOnboardingController extends Controller
{
    public function edit(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        if ($user !== null && filled($user->document_number)) {
            return redirect()->intended(HomePath::for($user));
        }

        return Inertia::render('auth/complete-document', [
            'user' => [
                'name' => $user?->name ?? '',
                'lastname' => $user?->lastname ?? '',
                'email' => $user?->email ?? '',
            ],
            'documentTypes' => DocumentType::values(),
            'departamentos' => GeoCatalog::departamentosPeru(),
        ]);
    }

    public function update(
        CompleteDocumentRequest $request,
        OwnerClaimService $claim,
    ): RedirectResponse {
        $user = $request->user();
        abort_unless($user !== null, 403);

        $data = $request->validated();
        $location = LocationHydrator::fromDistritoId((int) $data['distrito_id']);
        if ($location === null) {
            throw ValidationException::withMessages([
                'distrito_id' => __('Distrito no válido.'),
            ]);
        }

        $user->fill([
            'name' => $data['name'],
            'lastname' => $data['lastname'],
            'document_type' => $data['document_type'],
            'document_number' => $data['document_number'],
            'phone' => $data['phone'],
        ]);
        $user->save();

        $claim->ensureOwnerForUser($user->fresh() ?? $user, $location);

        return redirect()
            ->intended(HomePath::for($user))
            ->with('toast', [
                'type' => 'success',
                'message' => __('Documento verificado correctamente.'),
            ]);
    }
}
