<?php

namespace App\Http\Controllers\Api\Manga;

use App\Http\Controllers\Controller;
use App\Services\Media\MediaSectionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;
use Symfony\Component\HttpFoundation\Response;

#[OA\Tag(name: 'Manga', description: 'Manga catalog endpoints')]
class ListMangaRelationsController extends Controller
{
    #[OA\Get(
        path: '/api/v1/manga/{id}/relations',
        operationId: 'apiMangaRelations',
        summary: 'Lists related media for a manga',
        tags: ['Manga'],
        responses: [
            new OA\Response(response: 200, description: 'Related media list'),
            new OA\Response(response: 404, description: 'Manga not found'),
        ],
    )]
    public function __invoke(Request $request, MediaSectionService $sections, int $id): JsonResponse
    {
        if (! $sections->mangaExists($id)) {
            return response()->json([
                'message' => 'Manga not found.',
            ], Response::HTTP_NOT_FOUND);
        }

        return response()->json([
            'data' => $sections->relationsForManga($id, $request->user('sanctum')),
        ]);
    }
}
