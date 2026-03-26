<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\IndexUserAnimeNotificationsRequest;
use App\Models\User;
use App\Services\User\UserAnimeNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Tag(
    name: 'User Notifications',
    description: 'Authenticated user anime notifications',
)]
class UserAnimeNotificationController extends Controller
{
    #[OA\Get(
        path: '/api/v1/me/notifications',
        operationId: 'apiMeNotificationsIndex',
        summary: 'Lists the authenticated user notifications',
        tags: ['User Notifications'],
        security: [['sanctumBearerAuth' => []]],
        responses: [
            new OA\Response(response: 200, description: 'User notifications list'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ],
    )]
    public function index(
        IndexUserAnimeNotificationsRequest $request,
        UserAnimeNotificationService $notifications,
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();

        return response()->json($notifications->paginate($user, $request->validated()));
    }

    #[OA\Post(
        path: '/api/v1/me/notifications/{notification}/read',
        operationId: 'apiMeNotificationsRead',
        summary: 'Marks a single authenticated user notification as read',
        tags: ['User Notifications'],
        security: [['sanctumBearerAuth' => []]],
        parameters: [
            new OA\Parameter(
                name: 'notification',
                in: 'path',
                required: true,
                description: 'Notification identifier',
                schema: new OA\Schema(type: 'integer'),
                example: 1,
            ),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Notification marked as read'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 404, description: 'Notification not found'),
        ],
    )]
    public function read(
        Request $request,
        int $notification,
        UserAnimeNotificationService $notifications,
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();

        return response()->json($notifications->markAsRead($user, $notification));
    }

    #[OA\Post(
        path: '/api/v1/me/notifications/read-all',
        operationId: 'apiMeNotificationsReadAll',
        summary: 'Marks all authenticated user notifications as read',
        tags: ['User Notifications'],
        security: [['sanctumBearerAuth' => []]],
        responses: [
            new OA\Response(response: 200, description: 'Notifications marked as read'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ],
    )]
    public function readAll(Request $request, UserAnimeNotificationService $notifications): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return response()->json($notifications->markAllAsRead($user));
    }
}
