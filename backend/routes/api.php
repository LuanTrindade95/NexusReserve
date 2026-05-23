<?php

use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Resources\ResourceBlackoutController;
use App\Http\Controllers\Api\V1\Resources\ResourceController;
use App\Http\Controllers\Api\V1\Resources\ResourceTypeController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::prefix('auth')->group(function () {
        Route::post('login', [AuthController::class, 'login']);

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
            ->middleware('permission:resources.manage');

        Route::post('resources/{resource}/restore', [ResourceController::class, 'restore'])
            ->whereNumber('resource')
            ->middleware('permission:resources.manage');
        Route::get('resources/{resource}/audits', [ResourceController::class, 'audits'])
            ->middleware('permission:audit.view');

        Route::apiResource('resources', ResourceController::class)
            ->only(['index', 'show']);
        Route::apiResource('resources', ResourceController::class)
            ->only(['store', 'update', 'destroy'])
            ->middleware('permission:resources.manage');

        Route::get('resources/{resource}/blackouts', [ResourceBlackoutController::class, 'index']);
        Route::post('resources/{resource}/blackouts', [ResourceBlackoutController::class, 'store'])
            ->middleware('permission:resources.manage');
        Route::delete('resources/{resource}/blackouts/{blackout}', [ResourceBlackoutController::class, 'destroy'])
            ->middleware('permission:resources.manage');

    });
});
