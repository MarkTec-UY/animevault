<?php

namespace App\Http\Controllers\Api\Anime;

use App\Http\Controllers\Controller;
use App\Services\Media\MediaSectionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;
use Symfony\Component\HttpFoundation\Response;

#[OA\Tag(name: 'Anime', description: 'Anime catalog endpoints')]
class ListAnimeRelationsController extends Controller
{
    #[OA\Get(
        path: '/api/v1/anime/{id}/relations',
        operationId: 'apiAnimeRelations',
        summary: 'Lists related media for an anime',
        tags: ['Anime'],
        responses: [
            new OA\Response(response: 200, description: 'Related media list'),
            new OA\Response(response: 404, description: 'Anime not found'),
        ],
    )]
    public function __invoke(Request $request, MediaSectionService $sections, int $id): JsonResponse
    {
        if (! $sections->animeExists($id)) {
            return response()->json([
                'message' => 'Anime not found.',
            ], Response::HTTP_NOT_FOUND);
        }

        return response()->json([
            'data' => $sections->relationsForAnime($id, $request->user('sanctum')),
        ]);
    }
}
