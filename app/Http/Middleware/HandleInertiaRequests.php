<?php

namespace App\Http\Middleware;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Middleware;
use Throwable;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        /** @var User|null $user */
        $user = $request->user();

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'locale' => $request->getLocale(),
            'timezone' => (string) config('app.timezone', 'America/Lima'),
            'auth' => [
                'user' => $user,
                'permissions' => $this->resolveUserPermissions($user),
                'roles' => $this->resolveUserRoles($user),
                'organization' => $this->resolveOrganization($user),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'flash' => function () use ($request) {
                $session = $request->session();
                $payload = [
                    'success' => $session->get('success'),
                    'error' => $session->get('error'),
                    'info' => $session->get('info'),
                    'warning' => $session->get('warning'),
                    'catalog_created' => $session->get('catalog_created'),
                ];

                $hasMessage = collect($payload)
                    ->except('catalog_created')
                    ->filter(fn ($v) => is_string($v) && $v !== '')
                    ->isNotEmpty();

                $hasCatalog = is_array($payload['catalog_created']);

                if (! $hasMessage && ! $hasCatalog) {
                    return null;
                }

                return [
                    'id' => sha1(serialize($payload).microtime(true)),
                    ...$payload,
                ];
            },
            'push' => $this->resolvePushConfig($user),
        ];
    }

    /**
     * @return array{enabled: bool, vapidPublicKey: string|null}|null
     */
    private function resolvePushConfig(?User $user): ?array
    {
        if ($user === null) {
            return null;
        }

        $publicKey = trim((string) config('webpush.vapid.public_key', ''));

        return [
            'enabled' => filled($publicKey),
            'vapidPublicKey' => filled($publicKey) ? $publicKey : null,
        ];
    }

    /**
     * @return array{id: int, name: string, ruc: string}|null
     */
    private function resolveOrganization(?User $user): ?array
    {
        if ($user === null || ! $user->isClinicUser()) {
            return null;
        }

        $organization = $user->primaryOrganization();

        if ($organization === null) {
            return null;
        }

        return [
            'id' => $organization->id,
            'name' => $organization->name,
            'ruc' => $organization->ruc,
        ];
    }

    /**
     * @return list<string>
     */
    private function resolveUserPermissions(?User $user): array
    {
        if ($user === null) {
            return [];
        }

        try {
            return $user->getAllPermissions()->pluck('name')->values()->all();
        } catch (Throwable $e) {
            report($e);
            Log::error('No se pudieron cargar permisos Inertia.', [
                'user_id' => $user->id,
                'exception' => $e->getMessage(),
            ]);

            return [];
        }
    }

    /**
     * @return list<string>
     */
    private function resolveUserRoles(?User $user): array
    {
        if ($user === null) {
            return [];
        }

        try {
            return $user->getRoleNames()->values()->all();
        } catch (Throwable $e) {
            report($e);
            Log::error('No se pudieron cargar roles Inertia.', [
                'user_id' => $user->id,
                'exception' => $e->getMessage(),
            ]);

            return [];
        }
    }
}
