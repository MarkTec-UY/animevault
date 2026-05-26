<?php

namespace App\OpenApi;

use OpenApi\Attributes as OA;

#[OA\Info(
    version: '1.0.0',
    title: 'AnimeVault API',
    description: 'OpenAPI specification for the AnimeVault backend',
    contact: new OA\Contact(
        email: 'support@animevault.local',
    ),
    license: new OA\License(
        name: 'AnimeVault Non-Commercial Source License 1.0',
    ),
)]
#[OA\SecurityScheme(
    securityScheme: 'sanctumBearerAuth',
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'Token',
    description: 'Bearer token returned by the Sanctum login or register endpoints',
)]
final class OpenApiSpec {}
