import type { AnimeData } from "@/lib/types/anime"
import { apiFetch } from "@/lib/api/client"
import { API_CONFIG } from "@/lib/api-config"

export interface AnimeApiResponse {
  id: number
  preferred_title?: string
  titles?: {
    romaji?: string
    english?: string
    native?: string
  }
  description?: string
  synopsis?: string
  next_airing_at?: string | null
  next_airing_episode?: number | null
  cover_image?: {
    color?: string
    large?: string
  }
  cover?: {
    image?: {
      large?: string
    }
  }
  banner_image?: string
  bannerImage?: string
  format?: {
    code?: string
    description?: string
  } | string
  episodes?: number
  duration_minutes?: number
  duration?: number
  status?: {
    code?: string
    description?: string
  } | string
  start_date?: string
  startDate?: {
    year?: number
    month?: number
    day?: number
  }
  end_date?: string
  endDate?: {
    year?: number
    month?: number
    day?: number
  }
  season?: {
    code?: string
    description?: string
  } | string
  season_year?: number
  seasonYear?: number
  source?: {
    code?: string
    description?: string
  } | string
  average_score?: number
  meanScore?: number
  popularity?: number
  genres?: string[]
  tags?: Array<{
    id?: number
    name?: string
    description?: string
    category?: string
    rank?: number
  }>
  main_studio?: {
    id?: number
    name?: string
  }
  studios?: {
    edges?: Array<{
      node?: {
        name?: string
      }
    }>
  }
  is_favourite?: boolean
  isFavourite?: boolean
  [key: string]: unknown
}

/**
 * Fetch a single anime by ID from the backend API
 */
export async function fetchAnimeById(id: number | string): Promise<AnimeData | null> {
  try {
    const endpoint = API_CONFIG.endpoints.anime.show(id)
    const data = await apiFetch<AnimeApiResponse>(endpoint)
    return transformApiResponseToAnimeData(data)
  } catch (error) {
    console.error(`Failed to fetch anime ${id}:`, error)
    return null
  }
}

/**
 * Fetch anime by slug (will need backend support or use ID)
 * For now, this tries numeric ID first, then falls back to fallback data
 */
export async function fetchAnimeBySlug(slug: string): Promise<AnimeData | null> {
  // Try parsing as ID first (if slug is numeric)
  const maybeId = parseInt(slug, 10)
  if (!isNaN(maybeId)) {
    return fetchAnimeById(maybeId)
  }

  // TODO: Once backend supports slug-based queries, add that here
  // For now, return null to fall back to static data
  return null
}

/**
 * Transform API response to AnimeData format
 */
function transformApiResponseToAnimeData(apiData: AnimeApiResponse): AnimeData {
  // Extract title
  const title = 
    apiData.preferred_title ||
    apiData.titles?.romaji ||
    apiData.titles?.english ||
    "Unknown"
  const jaTitle = apiData.titles?.native || ""

  // Extract cover/poster image
  const poster = apiData.cover_image?.large || 
                apiData.cover?.image?.large || 
                "/images/anime-1.jpg"

  // Extract banner
  const banner = apiData.banner_image || 
                apiData.bannerImage || 
                "/images/anime-banner.jpg"

  // Extract format - handle both string and object
  const format = typeof apiData.format === "string" 
    ? apiData.format 
    : apiData.format?.code || "Unknown"

  // Extract status - handle both string and object
  const status = typeof apiData.status === "string"
    ? apiData.status
    : apiData.status?.code || "Unknown"

  // Extract season - handle both string and object
  const season = typeof apiData.season === "string"
    ? apiData.season
    : apiData.season?.code || ""

  // Extract source - handle both string and object
  const source = typeof apiData.source === "string"
    ? apiData.source
    : apiData.source?.code || "Unknown"

  // Extract score (normalize to 0-10 scale if needed)
  let score = apiData.average_score || apiData.meanScore || 0
  if (score > 10) {
    score = score / 10 // If 0-100 scale, convert to 0-10
  }

  // Extract duration
  const duration = apiData.duration_minutes 
    ? `${apiData.duration_minutes} min/ep`
    : apiData.duration
    ? `${apiData.duration} min/ep`
    : "Unknown"

  // Extract year from season_year or start_date
  let year = apiData.season_year || apiData.seasonYear
  if (!year && apiData.start_date) {
    year = new Date(apiData.start_date).getFullYear()
  }
  if (!year && apiData.startDate?.year) {
    year = apiData.startDate.year
  }
  if (!year) {
    year = new Date().getFullYear()
  }

  // Extract studio
  const studio = apiData.main_studio?.name ||
                apiData.studios?.edges?.[0]?.node?.name ||
                "Unknown"

  return {
    id: apiData.id,
    slug: `anime-${apiData.id}`,
    title,
    jaTitle,
    banner,
    poster,
    synopsis: apiData.description || apiData.synopsis || "",
    score,
    rank: 0, // TODO: Add to API response
    popularity: apiData.popularity || 0,
    members: formatMembers(apiData.popularity || 0),
    type: format,
    episodes: apiData.episodes || 0,
    duration,
    season,
    year,
    status,
    studio,
    source,
    rating: "PG-13", // TODO: Add to API response
    isAiring: status === "RELEASING" || status === "AIRING",
    genres: apiData.genres || [],
    nextAiringAt: apiData.next_airing_at || null,
    nextAiringEpisode: apiData.next_airing_episode || null,
    themes: (apiData.tags || []).map((tag) => tag.name || "").filter(Boolean),
    characters: [],
    episodes_list: [],
    staff: [],
    reviews: [],
    related: [],
    scoreBreakdown: [],
  }
}

/**
 * Format popularity number to human-readable member count
 */
function formatMembers(popularity: number): string {
  if (popularity >= 1000000) {
    return `${(popularity / 1000000).toFixed(1)}M`
  }
  if (popularity >= 1000) {
    return `${(popularity / 1000).toFixed(1)}K`
  }
  return popularity.toString()
}
