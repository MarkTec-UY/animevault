"use client"

import { AnimeGrid, LibraryEntryData } from "@/components/shared/anime-grid"
import type { LibraryEntry } from "@/lib/types/user"

function transformToLibraryEntry(entry: LibraryEntry): LibraryEntryData {
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
    status: entry.status,
    progress_episodes: entry.progress_episodes,
    score: entry.score,
  }
}

interface LibraryGridProps {
  entries?: LibraryEntry[]
  loading?: boolean
}

export function LibraryGrid({ entries, loading }: LibraryGridProps) {
  const transformedEntries = entries?.map(transformToLibraryEntry) || []

  return <AnimeGrid items={transformedEntries} variant="library" loading={loading} />
}