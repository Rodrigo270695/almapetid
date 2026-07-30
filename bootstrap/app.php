<?php

use App\Http\Middleware\AllowEmbedFraming;
use App\Http\Middleware\EnsureClinicUser;
use App\Http\Middleware\EnsureDocumentComplete;
use App\Http\Middleware\EnsurePlatformAdmin;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Spatie\Permission\Middleware\PermissionMiddleware;
use Spatie\Permission\Middleware\RoleMiddleware;
use Spatie\Permission\Middleware\RoleOrPermissionMiddleware;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state', 'almapetid_locale']);

        $middleware->validateCsrfTokens(except: [
            'webhooks/culqi',
        ]);

        $middleware->web(append: [
            HandleAppearance::class,
            \App\Http\Middleware\SetLocale::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'role' => RoleMiddleware::class,
            'permission' => PermissionMiddleware::class,
            'role_or_permission' => RoleOrPermissionMiddleware::class,
            'document.complete' => EnsureDocumentComplete::class,
            'clinic' => EnsureClinicUser::class,
            'platform' => EnsurePlatformAdmin::class,
            'embed.frame' => AllowEmbedFraming::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        $userFacingHttpMessage = static function (?string $message): ?string {
            if ($message === null || $message === '') {
                return null;
            }

            if (in_array($message, ['Not Found', 'Forbidden', 'Unauthorized.', 'Unauthorized'], true)) {
                return null;
            }

            if (str_starts_with($message, 'The route ')
                || str_starts_with($message, 'No query results for model')) {
                return null;
            }

            return $message;
        };

        $renderInertiaHttpError = static function (
            Request $request,
            int $status,
            string $page,
            ?string $message = null,
        ) use ($userFacingHttpMessage) {
            if ($request->expectsJson() && ! $request->header('X-Inertia')) {
                return null;
            }

            return Inertia::render($page, array_filter([
                'message' => $userFacingHttpMessage($message),
                'attempted_path' => '/'.ltrim($request->path(), '/'),
                'is_authenticated' => Auth::guard('web')->check(),
                'status' => $page === 'errors/server-error' ? $status : null,
            ], fn ($value) => $value !== null))
                ->toResponse($request)
                ->setStatusCode($status);
        };

        $exceptions->renderable(function (NotFoundHttpException $e, Request $request) use ($renderInertiaHttpError) {
            return $renderInertiaHttpError(
                $request,
                404,
                'errors/not-found',
                $e->getMessage() !== '' ? $e->getMessage() : null,
            );
        });

        $exceptions->renderable(function (ModelNotFoundException $e, Request $request) use ($renderInertiaHttpError) {
            return $renderInertiaHttpError($request, 404, 'errors/not-found', null);
        });

        $exceptions->renderable(function (AuthorizationException $e, Request $request) use ($renderInertiaHttpError) {
            return $renderInertiaHttpError(
                $request,
                403,
                'errors/forbidden',
                $e->getMessage() !== '' ? $e->getMessage() : null,
            );
        });

        $exceptions->renderable(function (HttpException $e, Request $request) use ($renderInertiaHttpError) {
            $status = $e->getStatusCode();

            if ($status === 403) {
                return $renderInertiaHttpError(
                    $request,
                    403,
                    'errors/forbidden',
                    $e->getMessage() !== '' ? $e->getMessage() : null,
                );
            }

            if ($status === 404) {
                return $renderInertiaHttpError(
                    $request,
                    404,
                    'errors/not-found',
                    $e->getMessage() !== '' ? $e->getMessage() : null,
                );
            }

            if (in_array($status, [500, 503], true)) {
                return $renderInertiaHttpError(
                    $request,
                    $status,
                    'errors/server-error',
                    $status === 503 && $e->getMessage() !== '' ? $e->getMessage() : null,
                );
            }

            return null;
        });

        $exceptions->renderable(function (\Throwable $e, Request $request) use ($renderInertiaHttpError) {
            if (app()->hasDebugModeEnabled()) {
                return null;
            }

            if ($e instanceof HttpException
                || $e instanceof ValidationException
                || $e instanceof AuthorizationException
                || $e instanceof ModelNotFoundException
                || $e instanceof NotFoundHttpException) {
                return null;
            }

            report($e);

            return $renderInertiaHttpError($request, 500, 'errors/server-error', null);
        });
    })->create();
