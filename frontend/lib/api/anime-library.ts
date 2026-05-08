import { apiFetch, type RequestOptions } from "@/lib/api/client"
import { getCsrfTokenFromDocument } from "@/lib/csrf"

async function fetchWithCsrf<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const csrfToken = await getCsrfTokenFromDocument()
  return apiFetch<T>(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      "X-XSRF-TOKEN": csrfToken,
    },
  })
}

export type UserAnimeStatus =
  | "watching"
  | "completed"
  | "paused"
  | "dropped"
  | "planning"

export interface UserAnimeEntry {
  id: number
  anime_id: number
  status: UserAnimeStatus
  progress_episodes: number | null
  total_episodes: number | null
  score: number | null
  is_favorite: boolean
  notes: string | null
  started_at: string | null
  finished_at: string | null
  updated_at: string
}

export interface LibraryEntryResponse {
  data: {
    id: number
    anime_id: number
    status: string
    progress_episodes: number | null
    is_favorite: boolean
    notes: string | null
    started_at: string | null
    finished_at: string | null
    updated_at: string
  }
}

export async function getUserAnimeEntry(
  animeId: number
): Promise<UserAnimeEntry | null> {
  try {
    const response = await fetchWithCsrf<{
      anime: { id: number }
      library_entry: {
        id: number
        anime_id: number
        status: string
        progress_episodes: number | null
        score: number | null
        is_favorite: boolean
        notes: string | null
        started_at: string | null
        finished_at: string | null
        updated_at: string
      } | null
    }>(`/api/v1/me/anime/${animeId}`)

    if (!response.library_entry) {
      return null
    }

    return {
      id: response.library_entry.id,
      anime_id: response.library_entry.anime_id,
      status: response.library_entry.status as UserAnimeStatus,
      progress_episodes: response.library_entry.progress_episodes,
      total_episodes: null,
      score: response.library_entry.score,
      is_favorite: response.library_entry.is_favorite,
      notes: response.library_entry.notes,
      started_at: response.library_entry.started_at,
      finished_at: response.library_entry.finished_at,
      updated_at: response.library_entry.updated_at,
    }
  } catch {
    return null
  }
}

export interface UpdateAnimeEntryPayload {
  status: UserAnimeStatus
  progress_episodes?: number | null
  score?: number | null
  notes?: string | null
  started_at?: string | null
  finished_at?: string | null
}

export async function updateAnimeEntry(
  animeId: number,
  payload: UpdateAnimeEntryPayload
): Promise<UserAnimeEntry> {
  const response = await fetchWithCsrf<{
    anime: { id: number }
    library_entry: {
      id: number
      anime_id: number
      status: string
      progress_episodes: number | null
      score: number | null
      is_favorite: boolean
      notes: string | null
      started_at: string | null
      finished_at: string | null
      updated_at: string
    }
  }>(`/api/v1/me/library/${animeId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })

  const entry = response.library_entry
  return {
    id: entry.id,
    anime_id: entry.anime_id,
    status: entry.status as UserAnimeStatus,
    progress_episodes: entry.progress_episodes,
    total_episodes: null,
    score: entry.score,
    is_favorite: entry.is_favorite,
    notes: entry.notes,
    started_at: entry.started_at,
    finished_at: entry.finished_at,
    updated_at: entry.updated_at,
  }
}

export async function removeAnimeFromLibrary(animeId: number): Promise<void> {
  await fetchWithCsrf(`/api/v1/me/library/${animeId}`, {
    method: "DELETE",
  })
}

export async function getUserAnimeFavoriteStatus(animeId: number): Promise<boolean> {
  try {
    const response = await fetchWithCsrf<{ data?: { anime_id: number }[] }>("/api/v1/me/favorites", {
      method: "GET",
    })
    const data = response.data ?? []
    return data.some((fav) => fav.anime_id === animeId)
  } catch {
    return false
  }
}

export async function addToFavorites(animeId: number): Promise<void> {
  await fetchWithCsrf(`/api/v1/me/favorites/${animeId}`, {
    method: "PUT",
  })
}

export async function removeFromFavorites(animeId: number): Promise<void> {
  await fetchWithCsrf(`/api/v1/me/favorites/${animeId}`, {
    method: "DELETE",
  })
}

export async function toggleFavorite(
  animeId: number,
  isFavorite: boolean
): Promise<void> {
  if (isFavorite) {
    return removeFromFavorites(animeId)
  }
  return addToFavorites(animeId)
}
