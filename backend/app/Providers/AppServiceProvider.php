<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('auth-login', function (Request $request): Limit {
            $email = Str::lower($request->string('email')->toString());
            $key = implode('|', [$email, $request->ip()]);

            return Limit::perMinute(5)
                ->by($key)
                ->response(fn (Request $request, array $headers): JsonResponse => response()->json([
                    'message' => 'Too many login attempts. Please try again in a minute.',
                ], 429, $headers));
        });

        RateLimiter::for('auth-register', function (Request $request): Limit {
            return Limit::perMinute(3)
                ->by($request->ip())
                ->response(fn (Request $request, array $headers): JsonResponse => response()->json([
                    'message' => 'Too many registration attempts. Please try again in a minute.',
                ], 429, $headers));
        });
    }
}
