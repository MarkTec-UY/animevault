<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Manga\MangaCatalogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;
use Symfony\Component\HttpFoundation\Response;

#[OA\Tag(
    name: 'Manga',
    description: 'Manga catalog endpoints',
)]
class ShowMangaController extends Controller
{
    #[OA\Get(
        path: '/api/v1/manga/{id}',
        operationId: 'apiMangaShow',
        summary: 'Gets a single manga with its related metadata',
        tags: ['Manga'],
        parameters: [
            new OA\Parameter(
                name: 'id',
                in: 'path',
                required: true,
                description: 'Manga identifier',
                schema: new OA\Schema(type: 'integer'),
                example: 1,
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Manga found',
            ),
            new OA\Response(
                response: 404,
                description: 'Manga not found',
            ),
        ],
    )]
    public function __invoke(Request $request, MangaCatalogService $catalog, int $id): JsonResponse
    {
        $manga = $catalog->find($id, $request->user('sanctum'));

        if ($manga === null) {
            return response()->json([
                'message' => 'Manga not found.',
            ], Response::HTTP_NOT_FOUND);
        }

        return response()->json($manga);
    }
}
