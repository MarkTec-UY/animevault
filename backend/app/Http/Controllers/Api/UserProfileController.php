<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateUserProfileRequest;
use App\Models\User;
use App\Services\User\UserProfileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Tag(
    name: 'User Profile',
    description: 'Authenticated and public user profile endpoints',
)]
class UserProfileController extends Controller
{
    #[OA\Put(
        path: '/api/v1/me/profile',
        operationId: 'apiMeProfileUpdate',
        summary: 'Updates the authenticated user profile and preferences',
        tags: ['User Profile'],
        security: [['sanctumBearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: false,
            content: new OA\MediaType(
                mediaType: 'multipart/form-data',
                schema: new OA\Schema(
                    properties: [
                        new OA\Property(property: 'about_me', type: 'string', nullable: true, maxLength: 1000),
                        new OA\Property(property: 'avatar', type: 'string', format: 'binary', nullable: true),
                        new OA\Property(property: 'banner', type: 'string', format: 'binary', nullable: true),
                        new OA\Property(property: 'remove_avatar', type: 'boolean', nullable: true),
                        new OA\Property(property: 'remove_banner', type: 'boolean', nullable: true),
                        new OA\Property(property: 'timezone', type: 'string', example: 'America/Montevideo'),
                        new OA\Property(property: 'is_profile_public', type: 'boolean', example: true),
                        new OA\Property(property: 'preferred_title_language', type: 'string', enum: ['romaji', 'english', 'native']),
                        new OA\Property(property: 'preferred_scoring_system', type: 'string', enum: ['point_100', 'point_10_decimal', 'point_10', 'star_5']),
                    ],
                    type: 'object',
                ),
            ),
        ),
        responses: [
            new OA\Response(response: 200, description: 'User profile updated'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 422, description: 'Validation error'),
        ],
    )]
    public function update(UpdateUserProfileRequest $request, UserProfileService $profiles): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $this->authorize('updateProfile', $user);

        $user = $profiles->update($user, $request->validated());

        return response()->json([
            'user' => $profiles->authenticatedPayload($user),
        ]);
    }

    #[OA\Get(
        path: '/api/v1/users/{user}',
        operationId: 'apiUsersShow',
        summary: 'Gets a public user profile when that profile is public',
        tags: ['User Profile'],
        parameters: [
            new OA\Parameter(
                name: 'user',
                in: 'path',
                required: true,
                description: 'User username',
                schema: new OA\Schema(type: 'string'),
                example: 'JoseVCF',
            ),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Public user profile'),
            new OA\Response(response: 404, description: 'User profile not found'),
        ],
    )]
    public function show(Request $request, string $user, UserProfileService $profiles): JsonResponse
    {
        $userModel = User::findByPublicIdentifierOrFail($user);
        $viewer = $request->user();

        if (! $userModel->isVisibleTo($viewer)) {
            abort(404, 'User profile not found.');
        }

        return response()->json([
            'user' => $profiles->publicPayload($userModel),
        ]);
    }
}
