<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Session\Middleware\StartSession;
use Symfony\Component\HttpFoundation\Response;

class EnsureSessionForApi
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->is('api/v1/me/*') || $request->is('api/v1/auth/me')) {
            app(StartSession::class)->handle($request, function () use ($request, $next) {
                return $next($request);
            });
        }

        return $next($request);
    }
}
