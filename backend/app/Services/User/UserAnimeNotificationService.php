<?php

namespace App\Services\User;

use App\Models\Anime;
use App\Models\User;
use App\Models\UserAnimeNotification;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Cache\Repository as CacheRepository;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Cache;

class UserAnimeNotificationService
{
    /**
     * @param  array<string, mixed>  $filters
     * @return array{data:list<array<string, mixed>>, meta:array<string, mixed>}
     */
    public function paginate(User $user, array $filters): array
    {
        $perPage = min(max((int) ($filters['per_page'] ?? 15), 1), 50);
        $page = max((int) ($filters['page'] ?? 1), 1);
        $unreadOnly = (bool) ($filters['unread_only'] ?? false);
        $version = $this->currentNotificationsVersion($user);

        return $this->cacheStore()->remember(
            $this->notificationsPageCacheKey($user, $version, $unreadOnly, $perPage, $page),
            $this->cacheTtl('user_notifications'),
            function () use ($user, $filters, $perPage, $page, $unreadOnly, $version): array {
                $query = UserAnimeNotification::query()
                    ->where('user_id', $user->id)
                    ->with([
                        'anime' => fn (BelongsTo $relation) => $relation->with('titles'),
                    ])
                    ->orderByDesc('created_at')
                    ->orderByDesc('id');

                if ($unreadOnly) {
                    $query->whereNull('read_at');
                }

                $paginator = $query->paginate($perPage, ['*'], 'page', $page)->appends($filters);

                return [
                    'data' => collect($paginator->items())
                        ->map(fn (UserAnimeNotification $notification): array => $this->mapNotification($notification, $user))
                        ->all(),
                    'meta' => [
                        'current_page' => $paginator->currentPage(),
                        'last_page' => $paginator->lastPage(),
                        'per_page' => $paginator->perPage(),
                        'total' => $paginator->total(),
                        'unread_count' => $this->unreadCount($user, $version),
                        'unread_only' => $unreadOnly,
                    ],
                ];
            },
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function markAsRead(User $user, int $notificationId): array
    {
        $notification = $this->resolveForUser($user, $notificationId);

        if ($notification->read_at === null) {
            $notification->forceFill(['read_at' => now()])->save();
            $this->bumpNotificationsVersion($user);
        }

        $notification->loadMissing([
            'anime' => fn (BelongsTo $relation) => $relation->with('titles'),
        ]);

        return $this->mapNotification($notification, $user);
    }

    /**
     * @return array<string, int>
     */
    public function markAllAsRead(User $user): array
    {
        $updated = UserAnimeNotification::query()
            ->where('user_id', $user->id)
            ->whereNull('read_at')
            ->update([
                'read_at' => now(),
                'updated_at' => now(),
            ]);

        if ($updated > 0) {
            $this->bumpNotificationsVersion($user);
        }

        return [
            'updated' => $updated,
            'unread_count' => 0,
        ];
    }

    /**
     * @param  iterable<int, int|string>  $userIds
     */
    public function bumpVersionsForUsers(iterable $userIds): void
    {
        $normalizedUserIds = collect($userIds)
            ->filter(fn (mixed $userId): bool => is_numeric($userId) && (int) $userId > 0)
            ->map(fn (mixed $userId): int => (int) $userId)
            ->unique()
            ->values()
            ->all();

        foreach ($normalizedUserIds as $userId) {
            $this->bumpUserNotificationsVersionById($userId);
        }
    }

    private function unreadCount(User $user, int $version): int
    {
        return $this->cacheStore()->remember(
            $this->unreadCountCacheKey($user, $version),
            $this->cacheTtl('user_notifications'),
            fn (): int => UserAnimeNotification::query()
                ->where('user_id', $user->id)
                ->whereNull('read_at')
                ->count(),
        );
    }

    private function resolveForUser(User $user, int $notificationId): UserAnimeNotification
    {
        $notification = UserAnimeNotification::query()
            ->where('user_id', $user->id)
            ->whereKey($notificationId)
            ->first();

        if ($notification === null) {
            throw (new ModelNotFoundException)->setModel(UserAnimeNotification::class, [$notificationId]);
        }

        return $notification;
    }

    /**
     * @return array<string, mixed>
     */
    private function mapNotification(UserAnimeNotification $notification, User $user): array
    {
        return [
            'id' => (int) $notification->id,
            'type' => $notification->type,
            'episode' => (int) $notification->episode,
            'title' => $notification->title,
            'body' => $notification->body,
            'read_at' => $this->nullableDateTimeString($notification->read_at, $user),
            'created_at' => $this->nullableDateTimeString($notification->created_at, $user),
            'anime' => $notification->anime === null ? null : $this->mapAnimePreview($notification->anime, $user),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function mapAnimePreview(Anime $anime, User $user): array
    {
        $titles = [
            'romaji' => $anime->titleByType('romaji'),
            'english' => $anime->titleByType('english'),
            'native' => $anime->titleByType('native'),
        ];

        return [
            'id' => (int) $anime->id,
            'preferred_title' => $user->preferredAnimeTitle($titles, (int) $anime->id),
            'titles' => $titles,
            'cover_image' => [
                'color' => $anime->cover_image_color,
                'large' => $anime->cover_image_large,
            ],
        ];
    }

    private function nullableDateTimeString(mixed $value, User $user): ?string
    {
        if ($value === null) {
            return null;
        }

        $dateTime = $value instanceof CarbonImmutable
            ? $value
            : CarbonImmutable::parse((string) $value);

        return $dateTime->setTimezone($user->resolvedTimezone())->toAtomString();
    }

    private function cacheStore(): CacheRepository
    {
        return Cache::store(config('anime.cache.store', 'redis'));
    }

    private function cacheTtl(string $key): int
    {
        return (int) config("anime.cache.ttls.{$key}", 120);
    }

    private function currentNotificationsVersion(User $user): int
    {
        return $this->currentNotificationsVersionById((int) $user->id);
    }

    private function currentNotificationsVersionById(int $userId): int
    {
        $versionKey = $this->notificationsVersionKey($userId);
        $version = $this->cacheStore()->get($versionKey);

        if (is_numeric($version) && (int) $version > 0) {
            return (int) $version;
        }

        $this->cacheStore()->forever($versionKey, 1);

        return 1;
    }

    private function bumpNotificationsVersion(User $user): void
    {
        $this->bumpUserNotificationsVersionById((int) $user->id);
    }

    private function bumpUserNotificationsVersionById(int $userId): void
    {
        $versionKey = $this->notificationsVersionKey($userId);
        $currentVersion = $this->cacheStore()->get($versionKey);

        if (is_numeric($currentVersion) && (int) $currentVersion > 0) {
            $this->cacheStore()->forever($versionKey, (int) $currentVersion + 1);

            return;
        }

        $this->cacheStore()->forever($versionKey, 2);
    }

    private function notificationsPageCacheKey(
        User $user,
        int $version,
        bool $unreadOnly,
        int $perPage,
        int $page,
    ): string {
        return 'user_notifications:list:'.sha1((string) json_encode([
            'user_id' => $user->id,
            'version' => $version,
            'timezone' => $user->resolvedTimezone(),
            'title_language' => $user->resolvedPreferredTitleLanguage(),
            'unread_only' => $unreadOnly,
            'per_page' => $perPage,
            'page' => $page,
        ]));
    }

    private function unreadCountCacheKey(User $user, int $version): string
    {
        return 'user_notifications:unread_count:'.sha1((string) json_encode([
            'user_id' => $user->id,
            'version' => $version,
        ]));
    }

    private function notificationsVersionKey(int $userId): string
    {
        return "user_notifications:version:{$userId}";
    }
}
