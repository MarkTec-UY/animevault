<?php

namespace App\Http\Controllers\Api\Anime;

use App\Http\Controllers\Controller;
use App\Services\Media\MediaSectionService;
use Illuminate\Http\JsonResponse;
use OpenApi\Attributes as OA;
use Symfony\Component\HttpFoundation\Response;

#[OA\Tag(name: 'Anime', description: 'Anime catalog endpoints')]
class ListAnimeStaffController extends Controller
{
    #[OA\Get(
        path: '/api/v1/anime/{id}/staff',
        operationId: 'apiAnimeStaff',
        summary: 'Lists staff members for an anime',
        tags: ['Anime'],
        responses: [
            new OA\Response(response: 200, description: 'Staff list'),
            new OA\Response(response: 404, description: 'Anime not found'),
        ],
    )]
    public function __invoke(MediaSectionService $sections, int $id): JsonResponse
    {
        if (! $sections->animeExists($id)) {
            return response()->json([
                'message' => 'Anime not found.',
            ], Response::HTTP_NOT_FOUND);
        }

        return response()->json([
            'data' => $sections->staffForAnime($id),
        ]);
    }
}
