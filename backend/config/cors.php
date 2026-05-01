<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure CORS settings for your application. The settings
    | will be applied automatically to your API routes.
    |
    | For Sanctum cookie-based auth, you MUST include the frontend origin in
    | allowed_origins and set supports_credentials to true.
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        ...collect(explode(',', env('FRONTEND_URL', 'http://localhost:3000')))
            ->map(fn ($url) => trim($url))
            ->filter()
            ->toArray(),
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'http://animevault-frontend:3000',
        'http://frontend:3000',
    ],

    'allowed_origins_patterns' => [
        '#^http://localhost(:\d+)?$#',
        '#^http://127\.0\.0\.1(:\d+)?$#',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,
];
