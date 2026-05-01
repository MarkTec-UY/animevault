import "server-only"

import { apiFetchServer } from "./api"
import { getServerUser } from "./auth"
import type {
  FavoriteItem,
  LibraryItem,
  LibraryStatus,
  NotificationItem,
  ProfileAnimeRef,
  ProfilePayload,
  ProfileStatsSummary,
  ProfileUser,
} from "@/lib/types/profile"

/**
 * Server-side fetchers for profile, library, favorites, and notifications.
 * All requests go through Next.js → Laravel via apiFetchServer (cookies forwarded).
 * The browser never calls the backend directly.
 */

const EMPTY_STATS: ProfileStatsSummary = {
  total: 0,
  watching: 0,
  completed: 0,
  paused: 0,
  dropped: 0,
  planning: 0,
  total_episodes: 0,
  mean_score: 0,
}

function safe<T>(value: unknown, fallback: T): T {
  return (value ?? fallback) as T
}

function toNumber(value: unknown, fallback = 0): number {
  const n = typeof value === "string" ? Number(value) : (value as number)
  return Number.isFinite(n) ? n : fallback
}

function normalizeAnime(raw: unknown): ProfileAnimeRef {
  const a = (raw ?? {}) as Record<string, unknown>
  return {
    id: toNumber(a.id),
    title: String(
      a.title ??
        a.preferred_title ??
        (a.titles as Record<string, unknown> | undefined)?.romaji ??
        "Unknown"
    ),
    cover_image_large: safe(
      a.cover_image_large ??
        (a.cover_image as Record<string, unknown> | undefined)?.large,
      null
    ),
    banner_image: safe(a.banner_image ?? a.bannerImage, null),
    average_score: a.average_score == null ? null : toNumber(a.average_score),
    popularity: a.popularity == null ? null : toNumber(a.popularity),
    favourites: a.favourites == null ? null : toNumber(a.favourites),
    episodes: a.episodes == null ? null : toNumber(a.episodes),
  }
}

function normalizeUser(raw: unknown): ProfileUser | null {
  if (!raw || typeof raw !== "object") return null
  const u = raw as Record<string, unknown>
  if (u.id == null) return null

  return {
    id: toNumber(u.id),
    name: String(u.name ?? u.username ?? ""),
    username: String(u.username ?? u.name ?? ""),
    email: safe(u.email, null),
    about_me: safe(u.about_me, null),
    avatar_path: safe(u.avatar_path, null),
    avatar_url: safe(u.avatar_url ?? u.avatar, null),
    banner_path: safe(u.banner_path, null),
    banner_url: safe(u.banner_url ?? u.banner, null),
    timezone: safe(u.timezone, null),
    is_profile_public:
      u.is_profile_public === undefined ? true : Boolean(u.is_profile_public),
    preferred_title_language:
      (u.preferred_title_language as ProfileUser["preferred_title_language"]) ??
      "romaji",
    preferred_scoring_system:
      (u.preferred_scoring_system as ProfileUser["preferred_scoring_system"]) ??
      "point_10",
    email_verified_at: safe(u.email_verified_at, null),
    created_at: safe(u.created_at, undefined),
    updated_at: safe(u.updated_at, undefined),
  }
}

function normalizeLibraryItem(raw: unknown): LibraryItem | null {
  const item = (raw ?? {}) as Record<string, unknown>
  
  const entry = item.library_entry as Record<string, unknown> | undefined
  const animeData = item.anime as Record<string, unknown> | undefined
  
  if (!entry && !animeData) return null
  
  const animeId = animeData?.id ? toNumber(animeData.id) : 0
  
  return {
    id: entry?.id ? toNumber(entry.id) : 0,
    user_id: 0,
    anime_id: animeId,
    status: (entry?.status as LibraryStatus) ?? "planning",
    progress_episodes: entry?.progress_episodes != null ? toNumber(entry.progress_episodes) : 0,
    score: entry?.score == null ? null : toNumber(entry?.score),
    started_at: safe(entry?.started_at, null),
    completed_at: safe(entry?.completed_at, null),
    anime: animeData ? normalizeAnime(animeData) : null,
  }
}

function normalizeFavorite(raw: unknown): FavoriteItem | null {
  const item = (raw ?? {}) as Record<string, unknown>
  if (item.id == null) return null
  return {
    id: toNumber(item.id),
    user_id: toNumber(item.user_id),
    anime_id: toNumber(item.anime_id),
    created_at: String(item.created_at ?? ""),
    anime: normalizeAnime(item.anime),
  }
}

function normalizeNotification(raw: unknown): NotificationItem | null {
  const item = (raw ?? {}) as Record<string, unknown>
  if (item.id == null) return null
  return {
    id: toNumber(item.id),
    user_id: toNumber(item.user_id),
    anime_id: item.anime_id == null ? null : toNumber(item.anime_id),
    type: String(item.type ?? "info"),
    title: String(item.title ?? "Notification"),
    message: safe(item.message, null),
    read_at: safe(item.read_at, null),
    created_at: String(item.created_at ?? new Date().toISOString()),
    anime: item.anime ? normalizeAnime(item.anime) : null,
  }
}

function buildStats(library: LibraryItem[]): ProfileStatsSummary {
  if (!library.length) return EMPTY_STATS

  const stats: ProfileStatsSummary = { ...EMPTY_STATS }
  let scoreSum = 0
  let scoreCount = 0

  for (const item of library) {
    stats.total++
    stats[item.status]++
    stats.total_episodes += item.progress_episodes
    if (item.score && item.score > 0) {
      scoreSum += item.score
      scoreCount++
    }
  }

  stats.mean_score = scoreCount > 0 ? +(scoreSum / scoreCount).toFixed(2) : 0
  return stats
}

async function tryFetch<T>(
  endpoint: string,
  fallback: T,
  headers: Record<string, string> = {}
): Promise<T> {
  try {
    return await apiFetchServer<T>(endpoint, {
      cache: "no-store",
      headers,
    })
  } catch {
    return fallback
  }
}

export async function getProfilePayload(
  username: string
): Promise<ProfilePayload | null> {
  const viewer = await getServerUser()

  const headers: Record<string, string> = {}
  if (viewer?.id) {
    headers['X-Viewer-Id'] = String(viewer.id)
  }

  const userResponse = await tryFetch<{ user?: unknown } | null>(
    `/api/v1/users/${encodeURIComponent(username)}`,
    null,
    headers
  )

  const userData = userResponse && 'user' in userResponse ? userResponse.user : userResponse
  const user = normalizeUser(userData)

  if (!user) return null

  const isOwnProfile =
    !!viewer &&
    (viewer.id === user.id ||
      viewer.username?.toLowerCase() === user.username.toLowerCase())

  // 3. If profile is private and viewer isn't the owner, return early.
  if (!user.is_profile_public && !isOwnProfile) {
    return {
      user,
      is_own_profile: false,
      stats: EMPTY_STATS,
      library: [],
      favorites: [],
      notifications: [],
    }
  }

  // 4. Fetch library, favorites, and (if own) notifications in parallel.
  const [libraryRaw, favoritesRaw, notificationsRaw] = await Promise.all([
    tryFetch<{ data?: unknown[] } | unknown[]>(
      `/api/v1/users/${encodeURIComponent(user.username)}/library`,
      [],
      headers
    ),
    tryFetch<{ data?: unknown[] } | unknown[]>(
      `/api/v1/users/${encodeURIComponent(user.username)}/favorites`,
      [],
      headers
    ),
    isOwnProfile
      ? tryFetch<{ data?: unknown[] } | unknown[]>(
          '/api/v1/me/notifications',
          [],
          headers
        )
      : Promise.resolve([] as unknown[]),
  ])

  const libraryArray = Array.isArray(libraryRaw)
    ? libraryRaw
    : (libraryRaw as { data?: unknown[] })?.data ?? []

  const library = libraryArray
    .map(normalizeLibraryItem)
    .filter((x): x is LibraryItem => x !== null)

  const favorites = (
    Array.isArray(favoritesRaw)
      ? favoritesRaw
      : (favoritesRaw as { data?: unknown[] })?.data ?? []
  )
    .map(normalizeFavorite)
    .filter((x): x is FavoriteItem => x !== null)

  const notifications = (
    Array.isArray(notificationsRaw)
      ? notificationsRaw
      : (notificationsRaw as { data?: unknown[] })?.data ?? []
  )
    .map(normalizeNotification)
    .filter((x): x is NotificationItem => x !== null)

  return {
    user,
    is_own_profile: isOwnProfile,
    stats: buildStats(library),
    library,
    favorites,
    notifications: isOwnProfile ? notifications : [],
  }
}

export async function getOwnProfile(): Promise<ProfileUser | null> {
  const response = await tryFetch<{ user?: unknown } | null>(
    '/auth/me',
    null
  )
  return normalizeUser(
    response && 'user' in (response as object)
      ? (response as { user: unknown }).user
      : response
  )
}
