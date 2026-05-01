"use client"

import { AnimeGrid, FavoriteEntryData } from "@/components/shared/anime-grid"
import type { FavoriteAnime } from "@/lib/types/user"

function transformToFavoriteEntry(entry: FavoriteAnime): FavoriteEntryData {
  return {
    anime: {
      id: entry.anime.id,
      title: entry.anime.title,
      poster_image: entry.anime.poster_image || entry.anime.cover_image,
      cover_image: entry.anime.cover_image,
      type: entry.anime.type ? { code: entry.anime.type } : undefined,
      status: entry.anime.status ? { code: entry.anime.status } : undefined,
      episodes: entry.anime.episodes,
      score: entry.anime.score,
    },
    is_favorite: true,
    created_at: entry.created_at,
  }
}

interface FavoritesGridProps {
  favorites?: FavoriteAnime[]
  loading?: boolean
}

export function FavoritesGrid({ favorites, loading }: FavoritesGridProps) {
  const transformedEntries = favorites?.map(transformToFavoriteEntry) || []

  return <AnimeGrid items={transformedEntries} variant="favorites" loading={loading} />
}