<?php

namespace App\Services\Anime;

use App\Enums\UserAnimeStatus;
use App\Models\Anime;
use App\Models\User;
use App\Models\UserAnimeLibraryEntry;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

class AnimeAiringNotificationService
{
    /**
     * @param  list<int>  $airedEpisodes
     */
    public function createEpisodeAiredNotifications(Anime $anime, array $airedEpisodes): void
    {
        if ($airedEpisodes === []) {
            return;
        }

        $anime->loadMissing('titles');
        $titles = [
            'romaji' => $anime->titleByType('romaji'),
            'english' => $anime->titleByType('english'),
            'native' => $anime->titleByType('native'),
        ];
        $timestamp = now();

        foreach ($airedEpisodes as $episode) {
            $userIds = $this->candidateUserIdsForEpisode($anime, $episode);

            if ($userIds === []) {
                continue;
            }

            $users = User::query()
                ->whereIn('id', $userIds)
                ->get(['id', 'preferred_title_language']);

            $rows = $users
                ->map(fn (User $user): array => [
                    'user_id' => (int) $user->id,
                    'anime_id' => (int) $anime->id,
                    'type' => 'episode_aired',
                    'episode' => $episode,
                    'title' => 'New episode aired',
                    'body' => sprintf(
                        'Episode %d of %s aired.',
                        $episode,
                        $user->preferredAnimeTitle($titles, (int) $anime->id)
                    ),
                    'created_at' => $timestamp,
                    'updated_at' => $timestamp,
                ])
                ->all();

            DB::table('user_anime_notifications')->insertOrIgnore($rows);
        }
    }

    /**
     * @return list<int>
     */
    public function detectNewlyAiredEpisodes(
        ?int $previousNextEpisode,
        mixed $previousNextAiringAt,
        ?int $currentNextEpisode,
        ?int $totalEpisodes,
        ?CarbonImmutable $now = null,
    ): array {
        if ($previousNextEpisode === null) {
            return [];
        }

        $referenceTime = $now ?? now()->toImmutable();
        $previousAiringAt = $this->normalizeDateTime($previousNextAiringAt);

        if ($previousAiringAt !== null && $previousAiringAt->gt($referenceTime)) {
            return [];
        }

        if ($currentNextEpisode !== null && $currentNextEpisode > $previousNextEpisode) {
            return range($previousNextEpisode, $currentNextEpisode - 1);
        }

        if ($currentNextEpisode === null) {
            if ($totalEpisodes !== null && $totalEpisodes >= $previousNextEpisode) {
                return range($previousNextEpisode, $totalEpisodes);
            }

            if ($previousAiringAt === null || $previousAiringAt->lte($referenceTime)) {
                return [$previousNextEpisode];
            }
        }

        return [];
    }

    /**
     * @return list<int>
     */
    private function candidateUserIdsForEpisode(Anime $anime, int $episode): array
    {
        return UserAnimeLibraryEntry::query()
            ->where('anime_id', $anime->id)
            ->where(function ($query) use ($episode): void {
                $query->where(function ($watchingQuery) use ($episode): void {
                    $watchingQuery
                        ->where('status', UserAnimeStatus::Watching->value)
                        ->where('progress_episodes', '<', $episode);
                });

                if ($episode === 1) {
                    $query->orWhere('status', UserAnimeStatus::Planning->value);
                }
            })
            ->pluck('user_id')
            ->map(fn (mixed $userId): int => (int) $userId)
            ->all();
    }

    private function normalizeDateTime(mixed $value): ?CarbonImmutable
    {
        if ($value === null || $value === '') {
            return null;
        }

        if ($value instanceof CarbonImmutable) {
            return $value;
        }

        return CarbonImmutable::parse($value);
    }
}
