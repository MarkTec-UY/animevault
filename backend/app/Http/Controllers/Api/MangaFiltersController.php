<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Manga\MangaCatalogService;
use Illuminate\Http\JsonResponse;
use OpenApi\Attributes as OA;

#[OA\Tag(
    name: 'Manga',
    description: 'Manga catalog endpoints',
)]
class MangaFiltersController extends Controller
{
    #[OA\Get(
        path: '/api/v1/manga/filters',
        operationId: 'apiMangaFilters',
        summary: 'Gets available filters for the manga catalog',
        tags: ['Manga'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Manga filters',
            ),
        ],
    )]
    public function __invoke(MangaCatalogService $catalog): JsonResponse
    {
        return response()->json($catalog->filters());
    }
}
