<?php

namespace App\Services\User;

use App\Models\User;
use Illuminate\Contracts\Cache\Repository as CacheRepository;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class UserProfileService
{
    /**
     * @param  array<string, mixed>  $payload
     */
    public function update(User $user, array $payload): User
    {
        if (($payload['remove_avatar'] ?? false) && ! ($payload['avatar'] ?? null) instanceof UploadedFile) {
            $this->deleteMedia($user->avatar_path);
            $user->avatar_path = null;
        }

        if (($payload['remove_banner'] ?? false) && ! ($payload['banner'] ?? null) instanceof UploadedFile) {
            $this->deleteMedia($user->banner_path);
            $user->banner_path = null;
        }

        if (($payload['avatar'] ?? null) instanceof UploadedFile) {
            $this->deleteMedia($user->avatar_path);
            $user->avatar_path = $payload['avatar']->storeAs(
                $this->avatarDirectory($user),
                $payload['avatar']->hashName(),
                'public',
            );
        }

        if (($payload['banner'] ?? null) instanceof UploadedFile) {
            $this->deleteMedia($user->banner_path);
            $user->banner_path = $payload['banner']->storeAs(
                $this->bannerDirectory($user),
                $payload['banner']->hashName(),
                'public',
            );
        }

        $user->fill([
            'about_me' => array_key_exists('about_me', $payload) ? $payload['about_me'] : $user->about_me,
            'timezone' => $payload['timezone'] ?? $user->resolvedTimezone(),
            'is_profile_public' => array_key_exists('is_profile_public', $payload)
                ? (bool) $payload['is_profile_public']
                : $user->isProfilePubliclyVisible(),
            'preferred_title_language' => $payload['preferred_title_language'] ?? $user->resolvedPreferredTitleLanguage(),
            'preferred_scoring_system' => $payload['preferred_scoring_system'] ?? $user->resolvedPreferredScoringSystem(),
        ]);

        $user->save();
        $user = $user->refresh();
        $this->forgetCachedPayloads($user);

        return $user;
    }

    /**
     * @return array<string, mixed>
     */
    public function authenticatedPayload(User $user): array
    {
        return $this->cacheStore()->remember(
            $this->authenticatedPayloadCacheKey($user),
            $this->cacheTtl('user_profile_authenticated'),
            fn (): array => array_merge($this->basePayload($user), [
                'email' => $user->email,
                'role' => $user->resolvedRole()->value,
                'created_at' => $user->created_at?->toAtomString(),
                'permissions' => [
                    'can_manage_news' => $user->canManageNews(),
                    'can_access_editor_panel' => $user->canManageNews(),
                ],
            ]),
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function publicPayload(User $user): array
    {
        return $this->cacheStore()->remember(
            $this->publicPayloadCacheKey($user),
            $this->cacheTtl('user_profile_public'),
            fn (): array => $this->basePayload($user),
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function basePayload(User $user): array
    {
        return [
            'id' => (int) $user->id,
            'username' => $user->username,
            'about_me' => $user->about_me,
            'avatar_url' => $user->avatarUrl(),
            'banner_url' => $user->bannerUrl(),
            'timezone' => $user->resolvedTimezone(),
            'is_profile_public' => $user->isProfilePubliclyVisible(),
            'preferred_title_language' => $user->resolvedPreferredTitleLanguage(),
            'preferred_scoring_system' => $user->resolvedPreferredScoringSystem(),
        ];
    }

    private function deleteMedia(?string $path): void
    {
        if (filled($path)) {
            Storage::disk('public')->delete($path);
        }
    }

    private function cacheStore(): CacheRepository
    {
        return Cache::store(config('anime.cache.store', 'redis'));
    }

    private function cacheTtl(string $key): int
    {
        return (int) config("anime.cache.ttls.{$key}", 300);
    }

    private function forgetCachedPayloads(User $user): void
    {
        $cache = $this->cacheStore();
        $cache->forget($this->publicPayloadCacheKey($user));
        $cache->forget($this->authenticatedPayloadCacheKey($user));
    }

    private function publicPayloadCacheKey(User $user): string
    {
        return "user_profile:public:{$user->id}";
    }

    private function authenticatedPayloadCacheKey(User $user): string
    {
        return "user_profile:authenticated:{$user->id}";
    }

    private function avatarDirectory(User $user): string
    {
        return sprintf('user-profile/%d/avatars', $user->id);
    }

    private function bannerDirectory(User $user): string
    {
        return sprintf('user-profile/%d/banners', $user->id);
    }
}
