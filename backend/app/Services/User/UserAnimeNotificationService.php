<?php

namespace App\Services\User;

use App\Models\Anime;
use App\Models\User;
use App\Models\UserAnimeNotification;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
                'unread_count' => $this->unreadCount($user),
                'unread_only' => $unreadOnly,
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function markAsRead(User $user, int $notificationId): array
    {
        $notification = $this->resolveForUser($user, $notificationId);

        if ($notification->read_at === null) {
            $notification->forceFill(['read_at' => now()])->save();
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

        return [
            'updated' => $updated,
            'unread_count' => $this->unreadCount($user),
        ];
    }

    private function unreadCount(User $user): int
    {
        return UserAnimeNotification::query()
            ->where('user_id', $user->id)
            ->whereNull('read_at')
            ->count();
    }

    private function resolveForUser(User $user, int $notificationId): UserAnimeNotification
    {
        $notification = UserAnimeNotification::query()
            ->where('user_id', $user->id)
            ->whereKey($notificationId)
            ->first();

        if ($notification === null) {
            throw (new ModelNotFoundException())->setModel(UserAnimeNotification::class, [$notificationId]);
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
}
