<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use OpenApi\Attributes as OA;

#[OA\Tag(
    name: 'System',
    description: 'System health and utility endpoints',
)]
class PingController extends Controller
{
    #[OA\Get(
        path: '/api/v1/ping',
        operationId: 'apiPing',
        summary: 'Checks that the API is reachable',
        tags: ['System'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'API is reachable',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: 'pong'),
                    ],
                    type: 'object',
                ),
            ),
        ],
    )]
    public function __invoke(): JsonResponse
    {
        return response()->json([
            'message' => 'pong',
        ]);
    }
}
