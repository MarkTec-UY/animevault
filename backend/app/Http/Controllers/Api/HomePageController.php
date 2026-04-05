<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Anime\AnimeHomeService;
use Illuminate\Http\JsonResponse;
use OpenApi\Attributes as OA;

#[OA\Tag(
    name: 'Home',
    description: 'Public home page feed endpoints',
)]
class HomePageController extends Controller
{
    #[OA\Get(
        path: '/api/v1/home',
        operationId: 'apiHomePage',
        summary: 'Returns the public landing page payload for the frontend home',
        tags: ['Home'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Home page payload',
            ),
        ],
    )]
    public function __invoke(AnimeHomeService $home): JsonResponse
    {
        return response()->json($home->payload());
    }
}
