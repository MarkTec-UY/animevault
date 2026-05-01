<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\IndexUserAnimeLibraryRequest;
use App\Http\Requests\UpsertUserAnimeLibraryRequest;
use App\Models\Anime;
use App\Models\User;
use App\Services\User\UserAnimeLibraryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use OpenApi\Attributes as OA;

#[OA\Tag(
    name: 'User Library',
    description: 'Authenticated user anime tracking and favorites',
)]

class UserAnimeLibraryController extends Controller
{
    #[OA\Get(
        path: '/api/v1/me/library',
        operationId: 'apiMeLibraryIndex',
        summary: 'Lists the authenticated user anime library',
        tags: ['User Library'],
        security: [['sanctumBearerAuth' => []]],
        responses: [
            new OA\Response(response: 200, description: 'User library list'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ],
    )]
    public function index(
        IndexUserAnimeLibraryRequest $request,
        UserAnimeLibraryService $library,
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();

        return response()->json($library->paginateLibrary($user, $request->validated()));
    }

    #[OA\Get(
        path: '/api/v1/users/{user}/library',
        operationId: 'apiUsersLibraryIndex',
        summary: 'Lists another user anime library when their profile is public',
        tags: ['User Library'],
        parameters: [
            new OA\Parameter(
                name: 'user',
                in: 'path',
                required: true,
                description: 'User username',
                schema: new OA\Schema(type: 'string'),
                example: 'JoseVCF',
            ),
            new OA\Parameter(
                name: 'status',
                in: 'query',
                required: false,
                description: 'Filters by one or more library statuses. Use comma-separated values.',
                style: 'form',
                explode: false,
                schema: new OA\Schema(
                    type: 'array',
                    items: new OA\Items(type: 'string')
                ),
                example: ['watching', 'completed'],
            ),
            new OA\Parameter(
                name: 'per_page',
                in: 'query',
                required: false,
                description: 'Number of items per page',
                schema: new OA\Schema(type: 'integer', minimum: 1, maximum: 50, default: 15),
                example: 15,
            ),
            new OA\Parameter(
                name: 'page',
                in: 'query',
                required: false,
                description: 'Page number',
                schema: new OA\Schema(type: 'integer', minimum: 1, default: 1),
                example: 1,
            ),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Public user library list'),
            new OA\Response(response: 404, description: 'User profile not found'),
        ],
    )]
    public function publicIndex(
        IndexUserAnimeLibraryRequest $request,
        string $user,
        UserAnimeLibraryService $library,
    ): JsonResponse {
        $userModel = User::where('username', $user)->firstOrFail();

        $viewerId = $request->header('X-Viewer-Id');
        $isOwner = $viewerId && (int) $viewerId === $userModel->id;

        if (! $userModel->isProfilePubliclyVisible() && ! $isOwner) {
            abort(403, 'This profile is private.');
        }

        return response()->json($library->paginateLibrary($userModel, $request->validated()));
    }

    #[OA\Get(
        path: '/api/v1/me/anime/{anime}',
        operationId: 'apiMeAnimeState',
        summary: 'Gets the authenticated user state for a specific anime',
        tags: ['User Library'],
        security: [['sanctumBearerAuth' => []]],
        parameters: [
            new OA\Parameter(
                name: 'anime',
                in: 'path',
                required: true,
                description: 'Anime identifier',
                schema: new OA\Schema(type: 'integer'),
                example: 1,
            ),
        ],
        responses: [
            new OA\Response(response: 200, description: 'User anime state'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 404, description: 'Anime not found'),
        ],
    )]
    public function show(Request $request, Anime $anime, UserAnimeLibraryService $library): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return response()->json($library->state($user, $anime));
    }

    #[OA\Put(
        path: '/api/v1/me/library/{anime}',
        operationId: 'apiMeLibraryUpsert',
        summary: 'Creates or updates a library entry for the authenticated user',
        tags: ['User Library'],
        security: [['sanctumBearerAuth' => []]],
        parameters: [
            new OA\Parameter(
                name: 'anime',
                in: 'path',
                required: true,
                description: 'Anime identifier',
                schema: new OA\Schema(type: 'integer'),
                example: 1,
            ),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['status'],
                properties: [
                    new OA\Property(property: 'status', type: 'string', example: 'watching'),
                    new OA\Property(property: 'progress_episodes', type: 'integer', nullable: true, example: 18),
                    new OA\Property(property: 'score', type: 'integer', nullable: true, example: 9),
                    new OA\Property(property: 'started_at', type: 'string', format: 'date-time', nullable: true),
                    new OA\Property(property: 'completed_at', type: 'string', format: 'date-time', nullable: true),
                ],
                type: 'object',
            ),
        ),
        responses: [
            new OA\Response(response: 200, description: 'Library entry updated'),
            new OA\Response(response: 201, description: 'Library entry created'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 404, description: 'Anime not found'),
            new OA\Response(response: 422, description: 'Validation error'),
        ],
    )]
    public function upsert(
        UpsertUserAnimeLibraryRequest $request,
        Anime $anime,
        UserAnimeLibraryService $library,
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();

        $this->authorize('manageLibrary', $user);

        $entry = $library->upsert($user, $anime, $request->validated());
        $statusCode = $entry->wasRecentlyCreated ? Response::HTTP_CREATED : Response::HTTP_OK;
        $state = $library->state($user, $anime);

        return response()->json([
            'anime' => $state['anime'],
            'library_entry' => $state['library_entry'],
        ], $statusCode);
    }

    #[OA\Delete(
        path: '/api/v1/me/library/{anime}',
        operationId: 'apiMeLibraryDelete',
        summary: 'Deletes a library entry for the authenticated user',
        tags: ['User Library'],
        security: [['sanctumBearerAuth' => []]],
        parameters: [
            new OA\Parameter(
                name: 'anime',
                in: 'path',
                required: true,
                description: 'Anime identifier',
                schema: new OA\Schema(type: 'integer'),
                example: 1,
            ),
        ],
        responses: [
            new OA\Response(response: 204, description: 'Library entry deleted'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 404, description: 'Anime not found'),
        ],
    )]
    public function destroy(Request $request, Anime $anime, UserAnimeLibraryService $library): Response
    {
        /** @var User $user */
        $user = $request->user();

        $this->authorize('manageLibrary', $user);

        $library->remove($user, $anime);

        return response()->noContent();
    }
}
