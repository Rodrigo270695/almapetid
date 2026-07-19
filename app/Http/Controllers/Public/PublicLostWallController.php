<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Services\Public\PublicLostWallService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PublicLostWallController extends Controller
{
    public function __invoke(Request $request, PublicLostWallService $wall): Response
    {
        $data = $wall->wall([
            'city' => $request->string('city')->toString() ?: null,
            'species' => $request->string('species')->toString() ?: null,
        ]);

        return Inertia::render('public/lost-wall', [
            'pets' => $data['items'],
            'filters' => $data['filters'],
            'cities' => $data['cities'],
            'speciesOptions' => $data['species'],
            'totalOpen' => $data['total_open'],
        ]);
    }
}
