<?php

use App\Http\Controllers\Api\AnimeFiltersController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EditorSessionController;
use App\Http\Controllers\Api\HomePageController;
use App\Http\Controllers\Api\ListAnimeController;
use App\Http\Controllers\Api\PingController;
use App\Http\Controllers\Api\ShowAnimeController;
use App\Http\Controllers\Api\UserAnimeFavoriteController;
use App\Http\Controllers\Api\UserAnimeLibraryController;
use App\Http\Controllers\Api\UserAnimeNotificationController;
use App\Http\Controllers\Api\UserProfileController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::prefix('auth')->group(function (): void {
        Route::post('/register', [AuthController::class, 'register'])
            ->middleware('throttle:auth-register')
            ->name('api.auth.register');
        Route::post('/login', [AuthController::class, 'login'])
            ->middleware('throttle:auth-login')
            ->name('api.auth.login');
        Route::middleware('auth:sanctum')->group(function (): void {
            Route::get('/me', [AuthController::class, 'me'])->name('api.auth.me');
            Route::post('/logout', [AuthController::class, 'logout'])->name('api.auth.logout');
        });
    });

    Route::prefix('me')->middleware('auth:sanctum')->group(function (): void {
        Route::put('/profile', [UserProfileController::class, 'update'])->name('api.me.profile.update');
        Route::get('/library', [UserAnimeLibraryController::class, 'index'])->name('api.me.library.index');
        Route::get('/anime/{anime}', [UserAnimeLibraryController::class, 'show'])
            ->whereNumber('anime')
            ->name('api.me.anime.show');
        Route::put('/library/{anime}', [UserAnimeLibraryController::class, 'upsert'])
            ->whereNumber('anime')
            ->name('api.me.library.upsert');
        Route::delete('/library/{anime}', [UserAnimeLibraryController::class, 'destroy'])
            ->whereNumber('anime')
            ->name('api.me.library.destroy');
        Route::get('/favorites', [UserAnimeFavoriteController::class, 'index'])->name('api.me.favorites.index');
        Route::put('/favorites/{anime}', [UserAnimeFavoriteController::class, 'store'])
            ->whereNumber('anime')
            ->name('api.me.favorites.store');
        Route::delete('/favorites/{anime}', [UserAnimeFavoriteController::class, 'destroy'])
            ->whereNumber('anime')
            ->name('api.me.favorites.destroy');
        Route::get('/notifications', [UserAnimeNotificationController::class, 'index'])
            ->name('api.me.notifications.index');
        Route::post('/notifications/read-all', [UserAnimeNotificationController::class, 'readAll'])
            ->name('api.me.notifications.read-all');
        Route::post('/notifications/{notification}/read', [UserAnimeNotificationController::class, 'read'])
            ->whereNumber('notification')
            ->name('api.me.notifications.read');
    });

    Route::get('/users/{user}/library', [UserAnimeLibraryController::class, 'publicIndex'])
        ->whereNumber('user')
        ->name('api.users.library.index');
    Route::get('/users/{user}/favorites', [UserAnimeFavoriteController::class, 'publicIndex'])
        ->whereNumber('user')
        ->name('api.users.favorites.index');
    Route::get('/users/{user}', [UserProfileController::class, 'show'])
        ->whereNumber('user')
        ->name('api.users.show');
    Route::prefix('editor')->middleware(['auth:sanctum', 'manage-news'])->group(function (): void {
        Route::get('/session', EditorSessionController::class)->name('api.editor.session');
    });
    Route::get('/home', HomePageController::class)->name('api.home');
    Route::get('/ping', PingController::class)->name('api.ping');
    Route::get('/anime', ListAnimeController::class)->name('api.anime.index');
    Route::get('/anime/filters', AnimeFiltersController::class)->name('api.anime.filters');
    Route::get('/anime/{id}', ShowAnimeController::class)
        ->whereNumber('id')
        ->name('api.anime.show');
});
