<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\IndexAnimeRequest;
use App\Services\Anime\AnimeCatalogService;
use Illuminate\Http\JsonResponse;
use OpenApi\Attributes as OA;

#[OA\Tag(
    name: 'Anime',
    description: 'Anime catalog endpoints',
)]
class ListAnimeController extends Controller
{
    #[OA\Get(
        path: '/api/v1/anime',
        operationId: 'apiAnimeIndex',
        summary: 'Lists anime with pagination, filters and sorting',
        tags: ['Anime'],
        parameters: [
            new OA\Parameter(
                name: 'search',
                in: 'query',
                required: false,
                description: 'Searches by anime ID or title (romaji, english, native)',
                schema: new OA\Schema(type: 'string', maxLength: 255),
                example: 'cowboy bebop',
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
                example: ['TV', 'MOVIE'],
            ),
            new OA\Parameter(
                name: 'season',
                in: 'query',
                required: false,
                description: 'Filters by one or more season codes. Use comma-separated values.',
                style: 'form',
                explode: false,
                schema: new OA\Schema(
                    type: 'array',
                    items: new OA\Items(type: 'string')
                ),
                example: ['SPRING', 'FALL'],
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
                example: ['MANGA', 'ORIGINAL'],
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
                example: ['Action', 'Drama'],
            ),
            new OA\Parameter(
                name: 'year',
                in: 'query',
                required: false,
                description: 'Filters by season year',
                schema: new OA\Schema(type: 'integer', minimum: 1900, maximum: 2100),
                example: 2023,
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
                description: 'Paginated anime list',
            ),
        ],
    )]
    public function __invoke(IndexAnimeRequest $request, AnimeCatalogService $catalog): JsonResponse
    {
        return response()->json($catalog->paginate($request->validated(), $request->user('sanctum')));
    }
}
