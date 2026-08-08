<?php

use App\Http\Resources\ApiResponse;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->statefulApi();

        $middleware->alias([
            'auth.session' => \Illuminate\Session\Middleware\AuthenticateSession::class,
            'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->wantsJson(),
        );

        $exceptions->renderable(function (ValidationException $e, Request $request) {
            return ApiResponse::error(
                $e->getMessage(),
                422,
                $e->errors()
            );
        });

        $exceptions->renderable(function (AuthenticationException $e, Request $request) {
            return ApiResponse::error('Unauthenticated.', 401);
        });

        $exceptions->renderable(function (AuthorizationException|AccessDeniedHttpException $e, Request $request) {
            return ApiResponse::error($e->getMessage() ?: 'Forbidden.', 403);
        });

        $exceptions->renderable(function (ModelNotFoundException|NotFoundHttpException $e, Request $request) {
            return ApiResponse::error('Resource not found.', 404);
        });

        $exceptions->renderable(function (MethodNotAllowedHttpException $e, Request $request) {
            return ApiResponse::error('Method not allowed.', 405);
        });

        $exceptions->renderable(function (Throwable $e, Request $request) {
            if (! config('app.debug')) {
                return ApiResponse::error('Server error.', 500);
            }
        });
    })
    ->create();
