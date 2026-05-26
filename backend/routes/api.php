<?php

use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Notifications\NotificationController;
use App\Http\Controllers\Api\V1\Reservations\ReservationController;
use App\Http\Controllers\Api\V1\Resources\ResourceBlackoutController;
use App\Http\Controllers\Api\V1\Resources\ResourceController;
use App\Http\Controllers\Api\V1\Resources\ResourceTypeController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::prefix('auth')->group(function () {
        Route::post('login', [AuthController::class, 'login'])->middleware('throttle:auth');

        Route::middleware('auth:sanctum')->group(function () {
            Route::post('logout', [AuthController::class, 'logout']);
            Route::get('me', [AuthController::class, 'me']);
        });
    });

    Route::middleware('auth:sanctum')->group(function () {
        Route::apiResource('resource-types', ResourceTypeController::class)
            ->only(['index', 'show']);
        Route::apiResource('resource-types', ResourceTypeController::class)
            ->only(['store', 'update', 'destroy'])
            ->middleware(['permission:resources.manage', 'throttle:writes']);

        Route::post('resources/{resource}/restore', [ResourceController::class, 'restore'])
            ->whereNumber('resource')
            ->middleware(['permission:resources.manage', 'throttle:writes']);
        Route::get('resources/{resource}/audits', [ResourceController::class, 'audits'])
            ->middleware('permission:audit.view');

        Route::apiResource('resources', ResourceController::class)
            ->only(['index', 'show']);
        Route::apiResource('resources', ResourceController::class)
            ->only(['store', 'update', 'destroy'])
            ->middleware(['permission:resources.manage', 'throttle:writes']);

        Route::get('resources/{resource}/blackouts', [ResourceBlackoutController::class, 'index']);
        Route::post('resources/{resource}/blackouts', [ResourceBlackoutController::class, 'store'])
            ->middleware(['permission:resources.manage', 'throttle:writes']);
        Route::delete('resources/{resource}/blackouts/{blackout}', [ResourceBlackoutController::class, 'destroy'])
            ->middleware(['permission:resources.manage', 'throttle:writes']);

        Route::post('reservations/{reservation}/submit', [ReservationController::class, 'submit'])->middleware('throttle:writes');
        Route::post('reservations/{reservation}/approve', [ReservationController::class, 'approve'])
            ->middleware(['permission:reservations.approve', 'throttle:writes']);
        Route::post('reservations/{reservation}/reject', [ReservationController::class, 'reject'])
            ->middleware(['permission:reservations.approve', 'throttle:writes']);
        Route::post('reservations/{reservation}/check-out', [ReservationController::class, 'checkOut'])
            ->middleware(['permission:reservations.approve', 'throttle:writes']);
        Route::post('reservations/{reservation}/return', [ReservationController::class, 'returnReservation'])
            ->middleware(['permission:reservations.approve', 'throttle:writes']);
        Route::post('reservations/{reservation}/cancel', [ReservationController::class, 'cancel'])->middleware('throttle:writes');
        Route::get('reservations/{reservation}/audits', [ReservationController::class, 'audits'])
            ->middleware('permission:audit.view');
        Route::apiResource('reservations', ReservationController::class)->middleware('throttle:writes')->except(['index', 'show']);
        Route::apiResource('reservations', ReservationController::class)->only(['index', 'show']);

        Route::get('notifications', [NotificationController::class, 'index']);
        Route::post('notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
        Route::post('notifications/read-all', [NotificationController::class, 'markAllAsRead']);

    });
});
