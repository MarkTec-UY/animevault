<?php

namespace App\Services\User;

use App\Models\User;
use Illuminate\Http\UploadedFile;
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
            $user->avatar_path = $payload['avatar']->store("user-profile/{$user->id}/avatars", 'public');
        }

        if (($payload['banner'] ?? null) instanceof UploadedFile) {
            $this->deleteMedia($user->banner_path);
            $user->banner_path = $payload['banner']->store("user-profile/{$user->id}/banners", 'public');
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

        return $user->refresh();
    }

    /**
     * @return array<string, mixed>
     */
    public function authenticatedPayload(User $user): array
    {
        return array_merge($this->basePayload($user), [
            'email' => $user->email,
            'role' => $user->resolvedRole()->value,
            'permissions' => [
                'can_manage_news' => $user->canManageNews(),
                'can_access_editor_panel' => $user->canManageNews(),
            ],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function publicPayload(User $user): array
    {
        return $this->basePayload($user);
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
}
