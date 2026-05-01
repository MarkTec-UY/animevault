<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Models\User;
use App\Services\User\UserProfileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use OpenApi\Attributes as OA;
use Symfony\Component\HttpFoundation\Response;

#[OA\Tag(
    name: 'Auth',
    description: 'Authentication endpoints',
)]
class AuthController extends Controller
{
    private const int MAX_LOGIN_ATTEMPTS = 5;

    #[OA\Post(
        path: '/api/v1/auth/register',
        operationId: 'apiAuthRegister',
        summary: 'Registers a new user and authenticates via session',
        tags: ['Auth'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['username', 'email', 'password', 'password_confirmation'],
                properties: [
                    new OA\Property(property: 'username', type: 'string', example: 'JoseVCF'),
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
                                new OA\Property(property: 'username', type: 'string', example: 'JoseVCF'),
                                new OA\Property(property: 'email', type: 'string', format: 'email', example: 'jose@example.com'),
                            ],
                            type: 'object',
                        ),
                    ],
                    type: 'object',
                ),
            ),
        ],
    )]
    public function register(RegisterRequest $request, UserProfileService $profiles): JsonResponse
    {
        $user = User::query()->create([
            ...$request->validated(),
            'role' => UserRole::User->value,
        ]);

        auth()->login($user);

        return response()->json($this->authPayload($profiles, $user), Response::HTTP_CREATED);
    }

    #[OA\Post(
        path: '/api/v1/auth/login',
        operationId: 'apiAuthLogin',
        summary: 'Authenticates a user via session',
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
                                new OA\Property(property: 'username', type: 'string', example: 'JoseVCF'),
                                new OA\Property(property: 'email', type: 'string', format: 'email', example: 'jose@example.com'),
                            ],
                            type: 'object',
                        ),
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
            new OA\Response(
                response: 429,
                description: 'Too many login attempts',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: 'Too many login attempts. Please try again later.'),
                    ],
                    type: 'object',
                ),
            ),
        ],
    )]
    public function login(LoginRequest $request, UserProfileService $profiles): JsonResponse
    {
        $this->ensureNotRateLimited($request);

        $user = User::query()
            ->where('email', $request->string('email'))
            ->first();

        if ($user === null || ! Hash::check($request->string('password'), $user->password)) {
            RateLimiter::hit($this->throttleKey($request));

            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
            ]);
        }

        RateLimiter::clear($this->throttleKey($request));

        auth()->login($user);

        return response()->json($this->authPayload($profiles, $user));
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
        $user = $request->user();
        if ($user === null) {
            return response()->json(['message' => 'Unauthenticated.'], Response::HTTP_UNAUTHORIZED);
        }

        return response()->json([
            'user' => $profiles->authenticatedPayload($user),
            'timezone_options' => User::timezoneOptions(),
        ]);
    }

    #[OA\Post(
        path: '/api/v1/auth/logout',
        operationId: 'apiAuthLogout',
        summary: 'Logs out the authenticated user',
        tags: ['Auth'],
        security: [['sanctumBearerAuth' => []]],
        responses: [
            new OA\Response(response: 200, description: 'Logged out'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ],
    )]
    public function logout(Request $request): JsonResponse
    {
        auth()->logout();

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

    /**
     * @return array{user:array<string, mixed>}
     */
    private function authPayload(UserProfileService $profiles, User $user): array
    {
        return [
            'user' => $profiles->authenticatedPayload($user),
        ];
    }

    private function ensureNotRateLimited(Request $request): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey($request), self::MAX_LOGIN_ATTEMPTS)) {
            return;
        }

        $seconds = RateLimiter::availableIn($this->throttleKey($request));

        throw ValidationException::withMessages([
            'email' => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    private function throttleKey(Request $request): string
    {
        return strtolower($request->input('email')).'|'.$request->ip();
    }
}
