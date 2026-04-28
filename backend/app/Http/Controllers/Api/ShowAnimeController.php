<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Anime\AnimeCatalogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;
use Symfony\Component\HttpFoundation\Response;

#[OA\Tag(
    name: 'Anime',
    description: 'Anime catalog endpoints',
)]
class ShowAnimeController extends Controller
{
    #[OA\Get(
        path: '/api/v1/anime/{id}',
        operationId: 'apiAnimeShow',
        summary: 'Gets a single anime with its related metadata',
        tags: ['Anime'],
        parameters: [
            new OA\Parameter(
                name: 'id',
                in: 'path',
                required: true,
                description: 'Anime identifier',
                schema: new OA\Schema(type: 'integer'),
                example: 1,
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Anime found',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'id', type: 'integer', example: 1),
                        new OA\Property(
                            property: 'titles',
                            properties: [
                                new OA\Property(property: 'romaji', type: 'string', nullable: true, example: 'Cowboy Bebop'),
                                new OA\Property(property: 'english', type: 'string', nullable: true, example: 'Cowboy Bebop'),
                                new OA\Property(property: 'native', type: 'string', nullable: true, example: 'カウボーイビバップ'),
                            ],
                            type: 'object',
                        ),
                        new OA\Property(
                            property: 'genres',
                            type: 'array',
                            items: new OA\Items(type: 'string'),
                        ),
                    ],
                    type: 'object',
                ),
            ),
            new OA\Response(
                response: 404,
                description: 'Anime not found',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: 'Anime not found.'),
                    ],
                    type: 'object',
                ),
            ),
        ],
    )]
    public function __invoke(Request $request, AnimeCatalogService $catalog, int $id): JsonResponse
    {
        $anime = $catalog->find($id, $request->user('sanctum'));

        if ($anime === null) {
            return response()->json([
                'message' => 'Anime not found.',
            ], Response::HTTP_NOT_FOUND);
        }

        return response()->json($anime);
    }
}
