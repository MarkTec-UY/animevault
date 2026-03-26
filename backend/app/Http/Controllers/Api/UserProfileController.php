<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateUserProfileRequest;
use App\Models\User;
use App\Services\User\UserProfileService;
use Illuminate\Http\JsonResponse;
use OpenApi\Attributes as OA;

#[OA\Tag(
    name: 'User Profile',
    description: 'Authenticated and public user profile endpoints',
)]
class UserProfileController extends Controller
{
    public function update(UpdateUserProfileRequest $request, UserProfileService $profiles): JsonResponse
    {
        $user = $profiles->update($request->user(), $request->validated());

        return response()->json([
            'user' => $profiles->authenticatedPayload($user),
        ]);
    }

    public function show(User $user, UserProfileService $profiles): JsonResponse
    {
        if (! $user->isProfilePubliclyVisible()) {
            return response()->json([
                'message' => 'User profile not found.',
            ], 404);
        }

        return response()->json([
            'user' => $profiles->publicPayload($user),
        ]);
    }
}
