<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Models\User;
use App\Services\User\UserProfileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use OpenApi\Attributes as OA;

#[OA\Tag(
    name: 'Auth',
    description: 'Authentication endpoints',
)]
class AuthController extends Controller
{
    #[OA\Post(
        path: '/api/v1/auth/register',
        operationId: 'apiAuthRegister',
        summary: 'Registers a new user and returns a Sanctum token',
        tags: ['Auth'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['name', 'email', 'password', 'password_confirmation'],
                properties: [
                    new OA\Property(property: 'name', type: 'string', example: 'Jose'),
                    new OA\Property(property: 'email', type: 'string', format: 'email', example: 'jose@example.com'),
                    new OA\Property(property: 'password', type: 'string', format: 'password', example: 'password123'),
                    new OA\Property(property: 'password_confirmation', type: 'string', format: 'password', example: 'password123'),
                ],
                type: 'object',
            ),
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'User registered',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: 'user',
                            properties: [
                                new OA\Property(property: 'id', type: 'integer', example: 1),
                                new OA\Property(property: 'name', type: 'string', example: 'Jose'),
                                new OA\Property(property: 'email', type: 'string', format: 'email', example: 'jose@example.com'),
                            ],
                            type: 'object',
                        ),
                        new OA\Property(property: 'token', type: 'string', example: '1|sanctum-token-example'),
                        new OA\Property(property: 'token_type', type: 'string', example: 'Bearer'),
                    ],
                    type: 'object',
                ),
            ),
        ],
    )]
    public function register(RegisterRequest $request, UserProfileService $profiles): JsonResponse
    {
        $user = User::query()->create($request->validated());
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json($this->authPayload($profiles, $user, $token), 201);
    }

    #[OA\Post(
        path: '/api/v1/auth/login',
        operationId: 'apiAuthLogin',
        summary: 'Authenticates a user and returns a Sanctum token',
        tags: ['Auth'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['email', 'password'],
                properties: [
                    new OA\Property(property: 'email', type: 'string', format: 'email', example: 'jose@example.com'),
                    new OA\Property(property: 'password', type: 'string', format: 'password', example: 'password123'),
                ],
                type: 'object',
            ),
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'User authenticated',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: 'user',
                            properties: [
                                new OA\Property(property: 'id', type: 'integer', example: 1),
                                new OA\Property(property: 'name', type: 'string', example: 'Jose'),
                                new OA\Property(property: 'email', type: 'string', format: 'email', example: 'jose@example.com'),
                            ],
                            type: 'object',
                        ),
                        new OA\Property(property: 'token', type: 'string', example: '1|sanctum-token-example'),
                        new OA\Property(property: 'token_type', type: 'string', example: 'Bearer'),
                    ],
                    type: 'object',
                ),
            ),
            new OA\Response(
                response: 401,
                description: 'Invalid credentials',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: 'The provided credentials are incorrect.'),
                    ],
                    type: 'object',
                ),
            ),
        ],
    )]
    public function login(LoginRequest $request, UserProfileService $profiles): JsonResponse
    {
        $user = User::query()
            ->where('email', $request->string('email'))
            ->first();

        if ($user === null || ! Hash::check($request->string('password'), $user->password)) {
            return response()->json([
                'message' => 'The provided credentials are incorrect.',
            ], 401);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json($this->authPayload($profiles, $user, $token));
    }

    #[OA\Get(
        path: '/api/v1/auth/me',
        operationId: 'apiAuthMe',
        summary: 'Returns the authenticated user',
        tags: ['Auth'],
        security: [['sanctumBearerAuth' => []]],
        responses: [
            new OA\Response(response: 200, description: 'Authenticated user'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ],
    )]
    public function me(Request $request, UserProfileService $profiles): JsonResponse
    {
        return response()->json([
            'user' => $profiles->authenticatedPayload($request->user()),
        ]);
    }

    #[OA\Post(
        path: '/api/v1/auth/logout',
        operationId: 'apiAuthLogout',
        summary: 'Revokes the current Sanctum token',
        tags: ['Auth'],
        security: [['sanctumBearerAuth' => []]],
        responses: [
            new OA\Response(response: 200, description: 'Token revoked'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ],
    )]
    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

    /**
     * @return array{user:array<string, mixed>, token:string, token_type:string}
     */
    private function authPayload(UserProfileService $profiles, User $user, string $token): array
    {
        return [
            'user' => $profiles->authenticatedPayload($user),
            'token' => $token,
            'token_type' => 'Bearer',
        ];
    }
}
