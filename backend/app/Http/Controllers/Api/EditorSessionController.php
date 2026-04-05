<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\User\UserProfileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Tag(
    name: 'Editor',
    description: 'Protected editorial endpoints',
)]
class EditorSessionController extends Controller
{
    #[OA\Get(
        path: '/api/v1/editor/session',
        operationId: 'apiEditorSession',
        summary: 'Returns the authenticated editor session',
        tags: ['Editor'],
        security: [['sanctumBearerAuth' => []]],
        responses: [
            new OA\Response(response: 200, description: 'Authenticated editor'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Forbidden'),
        ],
    )]
    public function __invoke(Request $request, UserProfileService $profiles): JsonResponse
    {
        return response()->json([
            'user' => $profiles->authenticatedPayload($request->user()),
        ]);
    }
}
