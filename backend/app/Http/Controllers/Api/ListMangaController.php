<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\IndexMangaRequest;
use App\Services\Manga\MangaCatalogService;
use Illuminate\Http\JsonResponse;
use OpenApi\Attributes as OA;

#[OA\Tag(
    name: 'Manga',
    description: 'Manga catalog endpoints',
)]
class ListMangaController extends Controller
{
    #[OA\Get(
        path: '/api/v1/manga',
        operationId: 'apiMangaIndex',
        summary: 'Lists manga with pagination, filters and sorting',
        tags: ['Manga'],
        parameters: [
            new OA\Parameter(
                name: 'search',
                in: 'query',
                required: false,
                description: 'Searches by manga ID or title (romaji, english, native)',
                schema: new OA\Schema(type: 'string', maxLength: 255),
                example: 'one piece',
            ),
            new OA\Parameter(
                name: 'status',
                in: 'query',
                required: false,
                description: 'Filters by one or more status codes. Use comma-separated values.',
                style: 'form',
                explode: false,
                schema: new OA\Schema(
                    type: 'array',
                    items: new OA\Items(type: 'string')
                ),
                example: ['FINISHED', 'RELEASING'],
            ),
            new OA\Parameter(
                name: 'format',
                in: 'query',
                required: false,
                description: 'Filters by one or more format codes. Use comma-separated values.',
                style: 'form',
                explode: false,
                schema: new OA\Schema(
                    type: 'array',
                    items: new OA\Items(type: 'string')
                ),
                example: ['MANGA', 'ONE_SHOT'],
            ),
            new OA\Parameter(
                name: 'source',
                in: 'query',
                required: false,
                description: 'Filters by one or more source codes. Use comma-separated values.',
                style: 'form',
                explode: false,
                schema: new OA\Schema(
                    type: 'array',
                    items: new OA\Items(type: 'string')
                ),
                example: ['ORIGINAL'],
            ),
            new OA\Parameter(
                name: 'genres',
                in: 'query',
                required: false,
                description: 'Filters by one or more genres. Use comma-separated values.',
                style: 'form',
                explode: false,
                schema: new OA\Schema(
                    type: 'array',
                    items: new OA\Items(type: 'string')
                ),
                example: ['Action', 'Adventure'],
            ),
            new OA\Parameter(
                name: 'year',
                in: 'query',
                required: false,
                description: 'Filters by start year',
                schema: new OA\Schema(type: 'integer', minimum: 1900, maximum: 2100),
                example: 1997,
            ),
            new OA\Parameter(
                name: 'is_adult',
                in: 'query',
                required: false,
                description: 'Filters adult content',
                schema: new OA\Schema(type: 'boolean'),
                example: false,
            ),
            new OA\Parameter(
                name: 'sort',
                in: 'query',
                required: false,
                description: 'Sort order for the results',
                schema: new OA\Schema(
                    type: 'string',
                    enum: [
                        'popularity_desc',
                        'score_desc',
                        'favourites_desc',
                        'recently_updated',
                        'start_date_desc',
                        'title_asc',
                    ],
                    default: 'popularity_desc',
                ),
                example: 'popularity_desc',
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
            new OA\Response(
                response: 200,
                description: 'Paginated manga list',
            ),
        ],
    )]
    public function __invoke(IndexMangaRequest $request, MangaCatalogService $catalog): JsonResponse
    {
        return response()->json($catalog->paginate($request->validated(), $request->user('sanctum')));
    }
}
