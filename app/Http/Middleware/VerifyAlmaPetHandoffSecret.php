<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Protege POST /api/v1/handoff (VetSaaS → AlmaPet).
 * Header: X-AlmaPet-Handoff-Secret
 */
final class VerifyAlmaPetHandoffSecret
{
    public function handle(Request $request, Closure $next): Response
    {
        $expected = (string) config('vetsaas.handoff_secret', '');

        if ($expected === '') {
            return response()->json(['message' => 'Handoff no configurado.'], 503);
        }

        $provided = (string) $request->header('X-AlmaPet-Handoff-Secret', '');

        if ($provided === '' || ! hash_equals($expected, $provided)) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        return $next($request);
    }
}
