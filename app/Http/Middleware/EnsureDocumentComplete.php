<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureDocumentComplete
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null || filled($user->document_number)) {
            return $next($request);
        }

        if ($request->routeIs(
            'onboarding.document',
            'onboarding.document.update',
            'document.lookup-dni',
            'register.lookup-dni',
            'clinic.*',
            'logout',
            'verification.*',
        )) {
            return $next($request);
        }

        return redirect()->route('onboarding.document');
    }
}
