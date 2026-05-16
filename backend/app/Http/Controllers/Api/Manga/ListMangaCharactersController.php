<?php

namespace App\Http\Controllers\Api\Manga;

use App\Http\Controllers\Controller;
use App\Services\Media\MediaSectionService;
use Illuminate\Http\JsonResponse;
use OpenApi\Attributes as OA;
use Symfony\Component\HttpFoundation\Response;

#[OA\Tag(name: 'Manga', description: 'Manga catalog endpoints')]
class ListMangaCharactersController extends Controller
{
    #[OA\Get(
        path: '/api/v1/manga/{id}/characters',
        operationId: 'apiMangaCharacters',
        summary: 'Lists characters for a manga',
        tags: ['Manga'],
        responses: [
            new OA\Response(response: 200, description: 'Character list'),
            new OA\Response(response: 404, description: 'Manga not found'),
        ],
    )]
    public function __invoke(MediaSectionService $sections, int $id): JsonResponse
    {
        if (! $sections->mangaExists($id)) {
            return response()->json([
                'message' => 'Manga not found.',
            ], Response::HTTP_NOT_FOUND);
        }

        return response()->json([
            'data' => $sections->charactersForManga($id),
        ]);
    }
}
