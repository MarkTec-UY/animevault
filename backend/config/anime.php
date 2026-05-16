<?php

return [
    'cache' => [
        'store' => env('ANIME_API_CACHE_STORE', env('CACHE_STORE', 'file')),
        'ttls' => [
            'home' => (int) env('ANIME_API_HOME_CACHE_TTL', 300),
            'list' => (int) env('ANIME_API_LIST_CACHE_TTL', 300),
            'detail' => (int) env('ANIME_API_DETAIL_CACHE_TTL', 600),
            'sections' => (int) env('ANIME_API_SECTION_CACHE_TTL', 1800),
            'filters' => (int) env('ANIME_API_FILTERS_CACHE_TTL', 3600),
            'user_profile_public' => (int) env('ANIME_API_USER_PROFILE_PUBLIC_CACHE_TTL', 300),
            'user_profile_authenticated' => (int) env('ANIME_API_USER_PROFILE_AUTHENTICATED_CACHE_TTL', 120),
            'user_library' => (int) env('ANIME_API_USER_LIBRARY_CACHE_TTL', 120),
            'user_favorites' => (int) env('ANIME_API_USER_FAVORITES_CACHE_TTL', 120),
            'user_state' => (int) env('ANIME_API_USER_STATE_CACHE_TTL', 120),
            'user_notifications' => (int) env('ANIME_API_USER_NOTIFICATIONS_CACHE_TTL', 120),
        ],
    ],
];
