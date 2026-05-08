<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserCanManageNews
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user()?->fresh();

        if ($user === null) {
            return new JsonResponse([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        if (! $user->canManageNews()) {
            return new JsonResponse([
                'message' => 'You do not have permission to access this resource.',
            ], 403);
        }

        return $next($request);
    }
}
