<?php

use App\Exceptions\ReservationConflictException;
use App\Http\Middleware\ForceJsonResponse;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Spatie\ModelStates\Exceptions\CouldNotPerformTransition;
use Spatie\Permission\Exceptions\UnauthorizedException;
use Spatie\Permission\Middleware\PermissionMiddleware;
use Spatie\Permission\Middleware\RoleMiddleware;
use Spatie\Permission\Middleware\RoleOrPermissionMiddleware;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->api(prepend: [
            ForceJsonResponse::class,
        ]);

        $middleware->alias([
            'permission' => PermissionMiddleware::class,
            'role' => RoleMiddleware::class,
            'role_or_permission' => RoleOrPermissionMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (Throwable $exception, Request $request): ?JsonResponse {
            if (! $request->is('api/*')) {
                return null;
            }

            if ($exception instanceof ValidationException) {
                return response()->json([
                    'message' => 'The given data was invalid.',
                    'code' => 'validation.failed',
                    'errors' => $exception->errors(),
                ], 422);
            }

            if ($exception instanceof ReservationConflictException) {
                return response()->json([
                    'message' => $exception->getMessage(),
                    'code' => 'reservation.conflict',
                    'errors' => $exception->errors(),
                ], 409);
            }

            if ($exception instanceof CouldNotPerformTransition) {
                return response()->json([
                    'message' => 'The requested reservation transition is not allowed.',
                    'code' => 'reservation.invalid_transition',
                ], 422);
            }

            if ($exception instanceof AuthenticationException) {
                return response()->json([
                    'message' => 'Unauthenticated.',
                    'code' => 'auth.unauthenticated',
                ], 401);
            }

            if ($exception instanceof AuthorizationException || $exception instanceof UnauthorizedException) {
                return response()->json([
                    'message' => 'Forbidden.',
                    'code' => 'auth.forbidden',
                ], 403);
            }

            if ($exception instanceof ModelNotFoundException || $exception instanceof NotFoundHttpException) {
                return response()->json([
                    'message' => 'Not found.',
                    'code' => 'http.not_found',
                ], 404);
            }

            if ($exception instanceof HttpExceptionInterface) {
                $status = $exception->getStatusCode();

                return response()->json([
                    'message' => $exception->getMessage() ?: 'HTTP error.',
                    'code' => "http.{$status}",
                ], $status, $exception->getHeaders());
            }

            return response()->json([
                'message' => config('app.debug') ? $exception->getMessage() : 'Server error.',
                'code' => 'server.error',
            ], 500);
        });
    })->create();
