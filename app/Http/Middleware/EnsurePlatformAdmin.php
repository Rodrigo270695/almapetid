<?php

namespace App\Http\Middleware;

use App\Support\Auth\Roles;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePlatformAdmin
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null || ! $user->hasRole(Roles::PLATFORM_ADMIN)) {
            abort(403, __('Solo el administrador de plataforma puede acceder.'));
        }

        return $next($request);
    }
}
