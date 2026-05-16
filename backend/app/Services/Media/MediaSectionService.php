<?php

namespace App\Services\Media;

use App\Models\Anime;
use App\Models\AnimeRelation;
use App\Models\Character;
use App\Models\CharacterNameAlias;
use App\Models\CharacterRole;
use App\Models\Manga;
use App\Models\MangaRelation;
use App\Models\MediaCharacter;
use App\Models\MediaCharacterVoiceActor;
use App\Models\MediaReference;
use App\Models\MediaRelation;
use App\Models\MediaStaff;
use App\Models\Staff;
use App\Models\StaffNameAlias;
use App\Models\StaffPrimaryOccupation;
use App\Models\User;
use Illuminate\Contracts\Cache\Repository as CacheRepository;
use Illuminate\Support\Facades\Cache;

class MediaSectionService
{
    public function animeExists(int $animeId): bool
    {
        return Anime::query()->whereKey($animeId)->exists();
    }

    public function mangaExists(int $mangaId): bool
    {
        return Manga::query()->whereKey($mangaId)->exists();
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function relationsForAnime(int $animeId, ?User $user = null): array
    {
        return $this->cacheStore()->remember(
            $this->sectionCacheKey('anime', $animeId, 'relations', $user),
            $this->cacheTtl('detail'),
            function () use ($animeId, $user): array {
                return AnimeRelation::query()
                    ->where('anime_id', $animeId)
                    ->with([
                        'relationType:code,description',
                        'relatedMedia.typeReference:code,description',
                        'relatedMedia.formatReference:code,description',
                        'relatedMedia.statusReference:code,description',
                        'relatedMedia.anime:id,average_score',
                        'relatedMedia.manga:id,average_score',
                    ])
                    ->orderBy('sort_order')
                    ->orderBy('related_media_id')
                    ->get()
                    ->map(fn (AnimeRelation $relation): ?array => $this->mapRelatedMedia($relation->relatedMedia, $relation->relationType, (int) $relation->sort_order, $user))
                    ->filter()
                    ->values()
                    ->all();
            },
        );
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function relationsForManga(int $mangaId, ?User $user = null): array
    {
        return $this->cacheStore()->remember(
            $this->sectionCacheKey('manga', $mangaId, 'relations', $user),
            $this->cacheTtl('detail'),
            function () use ($mangaId, $user): array {
                return MangaRelation::query()
                    ->where('manga_id', $mangaId)
                    ->with([
                        'relationType:code,description',
                        'relatedMedia.typeReference:code,description',
                        'relatedMedia.formatReference:code,description',
                        'relatedMedia.statusReference:code,description',
                        'relatedMedia.anime:id,average_score',
                        'relatedMedia.manga:id,average_score',
                    ])
                    ->orderBy('sort_order')
                    ->orderBy('related_media_id')
                    ->get()
                    ->map(fn (MangaRelation $relation): ?array => $this->mapRelatedMedia($relation->relatedMedia, $relation->relationType, (int) $relation->sort_order, $user))
                    ->filter()
                    ->values()
                    ->all();
            },
        );
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function charactersForAnime(int $animeId): array
    {
        return $this->charactersForMedia('anime', $animeId);
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function charactersForManga(int $mangaId): array
    {
        return $this->charactersForMedia('manga', $mangaId);
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function staffForAnime(int $animeId): array
    {
        return $this->staffForMedia('anime', $animeId);
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function staffForManga(int $mangaId): array
    {
        return $this->staffForMedia('manga', $mangaId);
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function charactersForMedia(string $mediaType, int $mediaId): array
    {
        return $this->cacheStore()->remember(
            $this->sectionCacheKey($mediaType, $mediaId, 'characters'),
            $this->cacheTtl('detail'),
            function () use ($mediaId): array {
                $voiceActorEntriesByCharacterId = MediaCharacterVoiceActor::query()
                    ->where('media_id', $mediaId)
                    ->with([
                        'staff.aliases' => fn ($query) => $query->orderBy('sort_order'),
                        'staff.primaryOccupations' => fn ($query) => $query->orderBy('sort_order'),
                    ])
                    ->orderBy('character_id')
                    ->orderBy('sort_order')
                    ->get()
                    ->groupBy('character_id');

                return MediaCharacter::query()
                    ->where('media_id', $mediaId)
                    ->with([
                        'role:code,description',
                        'character.aliases' => fn ($query) => $query->orderBy('sort_order'),
                    ])
                    ->orderBy('sort_order')
                    ->orderBy('character_id')
                    ->get()
                    ->map(function (MediaCharacter $entry) use ($voiceActorEntriesByCharacterId): ?array {
                        $character = $entry->character;

                        if (! $character instanceof Character) {
                            return null;
                        }

                        $voiceActors = $voiceActorEntriesByCharacterId
                            ->get($entry->character_id, collect())
                            ->map(fn (MediaCharacterVoiceActor $voiceActorEntry): ?array => $this->mapVoiceActorEntry($voiceActorEntry))
                            ->filter()
                            ->values()
                            ->all();

                        return [
                            'id' => (int) $character->id,
                            'preferred_name' => $this->preferredCharacterName($character, $entry->character_name_override),
                            'name' => [
                                'full' => $character->full_name,
                                'native' => $character->native_name,
                                'preferred' => $character->user_preferred_name,
                                'override' => $entry->character_name_override,
                            ],
                            'role' => $this->mapCharacterRole($entry->role),
                            'image' => [
                                'large' => $character->image_large,
                                'medium' => $character->image_medium,
                            ],
                            'description' => $character->description,
                            'gender' => $character->gender,
                            'age_text' => $character->age_text,
                            'blood_type' => $character->blood_type,
                            'site_url' => $character->site_url,
                            'favourites' => $this->nullableInt($character->favourites),
                            'aliases' => $character->aliases
                                ->map(fn (CharacterNameAlias $alias): array => [
                                    'alias' => $alias->alias,
                                    'is_spoiler' => (bool) $alias->is_spoiler,
                                    'sort_order' => (int) $alias->sort_order,
                                ])
                                ->values()
                                ->all(),
                            'voice_actors' => $voiceActors,
                            'sort_order' => (int) $entry->sort_order,
                        ];
                    })
                    ->filter()
                    ->values()
                    ->all();
            },
        );
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function staffForMedia(string $mediaType, int $mediaId): array
    {
        return $this->cacheStore()->remember(
            $this->sectionCacheKey($mediaType, $mediaId, 'staff'),
            $this->cacheTtl('detail'),
            function () use ($mediaId): array {
                return MediaStaff::query()
                    ->where('media_id', $mediaId)
                    ->with([
                        'staff.aliases' => fn ($query) => $query->orderBy('sort_order'),
                        'staff.primaryOccupations' => fn ($query) => $query->orderBy('sort_order'),
                    ])
                    ->orderBy('sort_order')
                    ->orderBy('staff_id')
                    ->get()
                    ->map(fn (MediaStaff $entry): ?array => $this->mapStaffEntry($entry))
                    ->filter()
                    ->values()
                    ->all();
            },
        );
    }

    /**
     * @return array<string, mixed>|null
     */
    private function mapRelatedMedia(?MediaReference $media, ?MediaRelation $relationType, int $sortOrder, ?User $user = null): ?array
    {
        if (! $media instanceof MediaReference) {
            return null;
        }

        $titles = [
            'romaji' => $media->title_romaji,
            'english' => $media->title_english,
            'native' => $media->title_native,
        ];

        return [
            'id' => (int) $media->id,
            'preferred_title' => $this->preferredMediaTitle($titles, $user, (int) $media->id, $media->type_code),
            'titles' => $titles,
            'type' => $this->mapReference($media->typeReference?->code, $media->typeReference?->description),
            'format' => $this->mapReference($media->formatReference?->code, $media->formatReference?->description),
            'status' => $this->mapReference($media->statusReference?->code, $media->statusReference?->description),
            'relation' => $this->mapReference($relationType?->code, $relationType?->description),
            'average_score' => $this->nullableInt($media->anime?->average_score ?? $media->manga?->average_score),
            'cover_image' => [
                'color' => $media->cover_image_color,
                'large' => $media->cover_image_large,
            ],
            'banner_image' => $media->banner_image,
            'is_adult' => (bool) $media->is_adult,
            'start_date' => $this->nullableDateString($media->start_date),
            'end_date' => $this->nullableDateString($media->end_date),
            'sort_order' => $sortOrder,
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function mapStaffEntry(MediaStaff|MediaCharacterVoiceActor $entry): ?array
    {
        $staff = $entry->staff;

        if (! $staff instanceof Staff) {
            return null;
        }

        $roleName = $entry instanceof MediaStaff
            ? $entry->role_name
            : $entry->role_notes;

        return [
            'id' => (int) $staff->id,
            'preferred_name' => $this->preferredStaffName($staff),
            'name' => [
                'full' => $staff->full_name,
                'native' => $staff->native_name,
                'preferred' => $staff->user_preferred_name,
            ],
            'role_name' => $roleName,
            'language' => $staff->language,
            'image' => [
                'large' => $staff->image_large,
                'medium' => $staff->image_medium,
            ],
            'description' => $staff->description,
            'gender' => $staff->gender,
            'site_url' => $staff->site_url,
            'favourites' => $this->nullableInt($staff->favourites),
            'primary_occupations' => $staff->primaryOccupations
                ->map(fn (StaffPrimaryOccupation $occupation): string => $occupation->occupation)
                ->values()
                ->all(),
            'aliases' => $staff->aliases
                ->map(fn (StaffNameAlias $alias): string => $alias->alias)
                ->values()
                ->all(),
            'sort_order' => (int) $entry->sort_order,
            'role_notes' => $entry instanceof MediaCharacterVoiceActor ? $entry->role_notes : null,
            'dub_group' => $entry instanceof MediaCharacterVoiceActor ? $entry->dub_group : null,
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function mapVoiceActorEntry(MediaCharacterVoiceActor $entry): ?array
    {
        return $this->mapStaffEntry($entry);
    }

    private function preferredMediaTitle(array $titles, ?User $user, int $mediaId, ?string $typeCode): ?string
    {
        $orderedTypes = match ($user?->resolvedPreferredTitleLanguage() ?? User::DEFAULT_PREFERRED_TITLE_LANGUAGE) {
            'romaji' => ['romaji', 'english', 'native'],
            'native' => ['native', 'romaji', 'english'],
            default => ['english', 'romaji', 'native'],
        };

        foreach ($orderedTypes as $type) {
            if (filled($titles[$type] ?? null)) {
                return $titles[$type];
            }
        }

        $prefix = filled($typeCode) ? ucfirst(strtolower($typeCode)) : 'Media';

        return "{$prefix} #{$mediaId}";
    }

    private function preferredCharacterName(Character $character, ?string $override = null): string
    {
        return $override
            ?? $character->user_preferred_name
            ?? $character->full_name
            ?? $character->native_name
            ?? "Character #{$character->id}";
    }

    private function preferredStaffName(Staff $staff): string
    {
        return $staff->user_preferred_name
            ?? $staff->full_name
            ?? $staff->native_name
            ?? "Staff #{$staff->id}";
    }

    /**
     * @return array{code:string, description:?string}|null
     */
    private function mapReference(?string $code, ?string $description): ?array
    {
        if ($code === null) {
            return null;
        }

        return [
            'code' => $code,
            'description' => $description,
        ];
    }

    /**
     * @return array{code:string, description:?string}|null
     */
    private function mapCharacterRole(?CharacterRole $role): ?array
    {
        if (! $role instanceof CharacterRole) {
            return null;
        }

        return [
            'code' => $role->code,
            'description' => $role->description,
        ];
    }

    private function nullableInt(mixed $value): ?int
    {
        return is_numeric($value) ? (int) $value : null;
    }

    private function nullableDateString(mixed $value): ?string
    {
        return $value?->toDateString() ?? (is_string($value) ? $value : null);
    }

    private function cacheStore(): CacheRepository
    {
        return Cache::store(config('anime.cache.store', 'redis'));
    }

    private function cacheTtl(string $key): int
    {
        return (int) config("anime.cache.ttls.{$key}", 300);
    }

    private function sectionCacheKey(string $mediaType, int $mediaId, string $section, ?User $user = null): string
    {
        return "media_sections:{$mediaType}:{$mediaId}:{$section}:".($user?->resolvedPreferredTitleLanguage() ?? User::DEFAULT_PREFERRED_TITLE_LANGUAGE);
    }
}
