<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\UpdateUserProfileRequest;
use App\Services\Auth\SessionAuthService;
use App\Services\User\UserProfileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function register(
        RegisterRequest $request,
        SessionAuthService $auth,
        UserProfileService $profiles,
    ): JsonResponse {
        $user = $auth->register($request, $request->validated());

        return response()->json([
            'user' => $profiles->authenticatedPayload($user),
        ], 201);
    }

    public function login(
        LoginRequest $request,
        SessionAuthService $auth,
        UserProfileService $profiles,
    ): JsonResponse {
        $user = $auth->authenticate($request);

        return response()->json([
            'user' => $profiles->authenticatedPayload($user),
        ]);
    }

    public function me(Request $request, UserProfileService $profiles): JsonResponse
    {
        $user = $request->user();

        if ($user === null) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        return response()->json([
            'user' => $profiles->authenticatedPayload($user),
        ]);
    }

    public function updateProfile(
        UpdateUserProfileRequest $request,
        UserProfileService $profiles,
    ): JsonResponse {
        $user = $request->user();

        if ($user === null) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $user = $profiles->update($user, $request->validated());

        return response()->json([
            'user' => $profiles->authenticatedPayload($user),
        ]);
    }

    public function logout(Request $request, SessionAuthService $auth): JsonResponse
    {
        $auth->logout($request);

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }
}
