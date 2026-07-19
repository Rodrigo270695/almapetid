<?php

namespace App\Http\Middleware;

use App\Support\Auth\Roles;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureClinicUser
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null) {
            return redirect()->route('login');
        }

        if (! $user->hasAnyRole([Roles::ORG_ADMIN, Roles::CLINIC_STAFF])) {
            abort(403, __('No tienes acceso al panel de veterinaria.'));
        }

        if ($user->primaryOrganization() === null) {
            abort(403, __('Tu cuenta no está vinculada a una veterinaria.'));
        }

        return $next($request);
    }
}
