<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\IndexUserAnimeFavoritesRequest;
use App\Models\Anime;
use App\Models\User;
use App\Services\User\UserAnimeLibraryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use OpenApi\Attributes as OA;

#[OA\Tag(
    name: 'User Favorites',
    description: 'Authenticated user anime favorites',
)]
class UserAnimeFavoriteController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum')->except(['publicIndex']);
    }

    #[OA\Get(
        path: '/api/v1/me/favorites',
        operationId: 'apiMeFavoritesIndex',
        summary: 'Lists the authenticated user favorite anime',
        tags: ['User Favorites'],
        security: [['sanctumBearerAuth' => []]],
        responses: [
            new OA\Response(response: 200, description: 'Favorite anime list'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ],
    )]
    public function index(
        IndexUserAnimeFavoritesRequest $request,
        UserAnimeLibraryService $library,
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();

        return response()->json($library->paginateFavorites($user, $request->validated()));
    }

    #[OA\Get(
        path: '/api/v1/users/{user}/favorites',
        operationId: 'apiUsersFavoritesIndex',
        summary: 'Lists another user favorite anime when their profile is public',
        tags: ['User Favorites'],
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
            new OA\Response(response: 200, description: 'Public user favorites list'),
            new OA\Response(response: 404, description: 'User profile not found'),
        ],
    )]
    public function publicIndex(
        IndexUserAnimeFavoritesRequest $request,
        string $user,
        UserAnimeLibraryService $library,
    ): JsonResponse {
        $userModel = User::where('username', $user)->firstOrFail();
        $this->authorize('viewFavorites', $userModel);

        return response()->json($library->paginateFavorites($userModel, $request->validated()));
    }

    #[OA\Put(
        path: '/api/v1/me/favorites/{anime}',
        operationId: 'apiMeFavoritesUpsert',
        summary: 'Adds an anime to the authenticated user favorites',
        tags: ['User Favorites'],
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
            new OA\Response(response: 200, description: 'Favorite already existed'),
            new OA\Response(response: 201, description: 'Favorite created'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 404, description: 'Anime not found'),
        ],
    )]
    public function store(Request $request, Anime $anime, UserAnimeLibraryService $library): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $this->authorize('manageFavorites', $user);

        $favorite = $library->addFavorite($user, $anime);
        $statusCode = $favorite->wasRecentlyCreated ? Response::HTTP_CREATED : Response::HTTP_OK;

        return response()->json($library->state($user, $anime), $statusCode);
    }

    #[OA\Delete(
        path: '/api/v1/me/favorites/{anime}',
        operationId: 'apiMeFavoritesDelete',
        summary: 'Removes an anime from the authenticated user favorites',
        tags: ['User Favorites'],
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
            new OA\Response(response: 204, description: 'Favorite removed'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 404, description: 'Anime not found'),
        ],
    )]
    public function destroy(Request $request, Anime $anime, UserAnimeLibraryService $library): Response
    {
        /** @var User $user */
        $user = $request->user();

        $this->authorize('manageFavorites', $user);

        $library->removeFavorite($user, $anime);

        return response()->noContent();
    }
}
