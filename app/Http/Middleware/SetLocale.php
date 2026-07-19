<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    private const SUPPORTED = ['es', 'en'];

    private const COOKIE = 'almapetid_locale';

    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $locale = $this->resolveLocale($request);

        App::setLocale($locale);
        $request->setLocale($locale);

        return $next($request);
    }

    private function resolveLocale(Request $request): string
    {
        $candidates = [
            $request->cookie(self::COOKIE),
            $request->header('X-Locale'),
            $request->query('lang'),
            config('app.locale'),
        ];

        foreach ($candidates as $candidate) {
            if (! is_string($candidate) || $candidate === '') {
                continue;
            }

            $normalized = strtolower(str_replace('_', '-', $candidate));
            $short = explode('-', $normalized)[0] ?? '';

            if (in_array($short, self::SUPPORTED, true)) {
                return $short;
            }
        }

        return 'es';
    }
}
