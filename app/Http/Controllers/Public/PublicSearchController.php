<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Services\Public\PublicChipSearchService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PublicSearchController extends Controller
{
    public function __invoke(Request $request, PublicChipSearchService $search): Response
    {
        $payload = $search->search($request->string('q')->toString() ?: null);

        return Inertia::render('public/search', [
            'q' => $payload['q'],
            'state' => $payload['state'],
            'result' => $payload['result'],
        ]);
    }
}
