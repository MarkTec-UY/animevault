<?php

use App\Http\Controllers\Web\AuthController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::prefix('auth')->group(function (): void {
    Route::post('/login', [AuthController::class, 'login'])
        ->middleware('throttle:auth-login')
        ->name('auth.login');
    Route::post('/logout', [AuthController::class, 'logout'])
        ->middleware('auth:web')
        ->name('auth.logout');
    Route::get('/me', [AuthController::class, 'me'])
        ->middleware('auth:web')
        ->name('auth.me');
    Route::put('/profile', [AuthController::class, 'updateProfile'])
        ->middleware('auth:web')
        ->name('auth.profile.update');
});
