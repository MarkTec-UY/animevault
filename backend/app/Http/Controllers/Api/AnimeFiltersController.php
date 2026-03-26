<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Anime\AnimeCatalogService;
use Illuminate\Http\JsonResponse;
use OpenApi\Attributes as OA;

#[OA\Tag(
    name: 'Anime',
    description: 'Anime catalog endpoints',
)]
class AnimeFiltersController extends Controller
{
    #[OA\Get(
        path: '/api/v1/anime/filters',
        operationId: 'apiAnimeFilters',
        summary: 'Returns available filter values for anime discovery',
        tags: ['Anime'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Anime filter metadata',
            ),
        ],
    )]
    public function __invoke(AnimeCatalogService $catalog): JsonResponse
    {
        return response()->json($catalog->filters());
    }
}
