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
        $favorite = $library->addFavorite($user, $anime);
        $statusCode = $favorite->wasRecentlyCreated ? 201 : 200;

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

        $library->removeFavorite($user, $anime);

        return response()->noContent();
    }
}
