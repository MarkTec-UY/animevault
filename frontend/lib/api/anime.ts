import { API_CONFIG } from "@/lib/api-config"
import { apiFetch } from "@/lib/api/client"
import type { AnimeData, Character, RelatedAnime, StaffMember } from "@/lib/types/anime"

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

interface MediaApiResponse<T> {
  data: T[]
}

interface MediaReferenceApi {
  code?: string
  description?: string | null
}

interface AnimeRelationApiItem {
  id: number
  preferred_title?: string | null
  titles?: {
    romaji?: string | null
    english?: string | null
    native?: string | null
  }
  type?: MediaReferenceApi | null
  format?: MediaReferenceApi | null
  relation?: MediaReferenceApi | null
  average_score?: number | null
  cover_image?: {
    large?: string | null
  }
}

interface AnimeCharacterApiItem {
  id: number
  preferred_name?: string | null
  role?: MediaReferenceApi | null
  image?: {
    large?: string | null
    medium?: string | null
  }
  voice_actors?: Array<{
    id: number
    preferred_name?: string | null
    language?: string | null
    role_notes?: string | null
    dub_group?: string | null
    image?: {
      large?: string | null
      medium?: string | null
    }
  }>
}

interface AnimeStaffApiItem {
  id: number
  preferred_name?: string | null
  role_name?: string | null
  sort_order?: number | null
  image?: {
    large?: string | null
    medium?: string | null
  }
  primary_occupations?: string[]
}

interface FetchAnimeOptions {
  includeExtras?: boolean
}

interface AnimeExtraSections {
  relations: AnimeRelationApiItem[]
  characters: AnimeCharacterApiItem[]
  staff: AnimeStaffApiItem[]
}

/**
 * Fetch a single anime by ID from the backend API.
 */
export async function fetchAnimeById(
  id: number | string,
  options: FetchAnimeOptions = {},
): Promise<AnimeData | null> {
  try {
    const endpoint = API_CONFIG.endpoints.anime.show(id)
    const data = await fetchApi<AnimeApiResponse>(endpoint)
    const extras =
      options.includeExtras === false
        ? emptyAnimeExtras()
        : await fetchAnimeExtras(id)

    return transformApiResponseToAnimeData(data, extras)
  } catch (error) {
    console.error(`Failed to fetch anime ${id}:`, error)
    return null
  }
}

/**
 * Fetch anime by slug.
 */
export async function fetchAnimeBySlug(slug: string): Promise<AnimeData | null> {
  const maybeId = parseInt(slug, 10)
  if (!isNaN(maybeId)) {
    return fetchAnimeById(maybeId)
  }

  return null
}

export function transformApiResponseToAnimeData(
  apiData: AnimeApiResponse,
  extras: AnimeExtraSections = emptyAnimeExtras(),
): AnimeData {
  const title =
    apiData.preferred_title ||
    apiData.titles?.romaji ||
    apiData.titles?.english ||
    "Unknown"
  const jaTitle = apiData.titles?.native || ""

  const poster =
    apiData.cover_image?.large ||
    apiData.cover?.image?.large ||
    "/images/anime-1.jpg"

  const banner =
    apiData.banner_image ||
    apiData.bannerImage ||
    "/images/anime-banner.jpg"

  const format =
    typeof apiData.format === "string"
      ? apiData.format
      : apiData.format?.code || "Unknown"

  const status =
    typeof apiData.status === "string"
      ? apiData.status
      : apiData.status?.code || "Unknown"

  const season =
    typeof apiData.season === "string"
      ? apiData.season
      : apiData.season?.code || ""

  const source =
    typeof apiData.source === "string"
      ? apiData.source
      : apiData.source?.code || "Unknown"

  let score = apiData.average_score || apiData.meanScore || 0
  if (score > 10) {
    score = score / 10
  }

  const duration = apiData.duration_minutes
    ? `${apiData.duration_minutes} min/ep`
    : apiData.duration
      ? `${apiData.duration} min/ep`
      : "Unknown"

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

  const studio =
    apiData.main_studio?.name ||
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
    rank: 0,
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
    rating: "PG-13",
    isAiring: status === "RELEASING" || status === "AIRING",
    genres: apiData.genres || [],
    nextAiringAt: apiData.next_airing_at || null,
    nextAiringEpisode: apiData.next_airing_episode || null,
    themes: (apiData.tags || []).map((tag) => tag.name || "").filter(Boolean),
    characters: extras.characters.map(transformAnimeCharacter),
    episodes_list: [],
    staff: extras.staff.map(transformAnimeStaff),
    reviews: [],
    related: extras.relations.map(transformAnimeRelation),
    scoreBreakdown: [],
  }
}

async function fetchAnimeExtras(id: number | string): Promise<AnimeExtraSections> {
  const [relationsResult, charactersResult, staffResult] = await Promise.allSettled([
    fetchApi<MediaApiResponse<AnimeRelationApiItem>>(API_CONFIG.endpoints.anime.relations(id)),
    fetchApi<MediaApiResponse<AnimeCharacterApiItem>>(API_CONFIG.endpoints.anime.characters(id)),
    fetchApi<MediaApiResponse<AnimeStaffApiItem>>(API_CONFIG.endpoints.anime.staff(id)),
  ])

  return {
    relations: unwrapSection(relationsResult, "anime relations"),
    characters: unwrapSection(charactersResult, "anime characters"),
    staff: unwrapSection(staffResult, "anime staff"),
  }
}

async function fetchApi<T>(endpoint: string): Promise<T> {
  return apiFetch<T>(endpoint)
}

function unwrapSection<T>(
  result: PromiseSettledResult<MediaApiResponse<T>>,
  label: string,
): T[] {
  if (result.status === "fulfilled") {
    return result.value.data ?? []
  }

  console.error(`Failed to fetch ${label}:`, result.reason)
  return []
}

function transformAnimeRelation(item: AnimeRelationApiItem): RelatedAnime {
  let score = item.average_score ?? null
  if (score !== null && score > 10) {
    score = score / 10
  }

  return {
    id: item.id,
    title:
      item.preferred_title ||
      item.titles?.romaji ||
      item.titles?.english ||
      item.titles?.native ||
      `Media #${item.id}`,
    poster: item.cover_image?.large || "/images/anime-1.jpg",
    type: item.format?.description || item.format?.code || "Unknown",
    relation: item.relation?.description || item.relation?.code || "Related",
    score,
    mediaType: item.type?.code === "MANGA" ? "MANGA" : "ANIME",
  }
}

function transformAnimeCharacter(item: AnimeCharacterApiItem): Character {
  const voiceActors = (item.voice_actors || []).map((voiceActor) => ({
    id: voiceActor.id,
    name: voiceActor.preferred_name || `Staff #${voiceActor.id}`,
    image:
      voiceActor.image?.large ||
      voiceActor.image?.medium ||
      "/images/avatar.jpg",
    language: voiceActor.language || null,
    roleNotes: voiceActor.role_notes || null,
    dubGroup: voiceActor.dub_group || null,
  }))

  return {
    id: item.id,
    name: item.preferred_name || `Character #${item.id}`,
    role: item.role?.description || item.role?.code || "Unknown",
    image: item.image?.large || item.image?.medium || "/images/anime-1.jpg",
    voiceActor: voiceActors.map((voiceActor) => voiceActor.name).join(", "),
    voiceActors,
  }
}

function transformAnimeStaff(item: AnimeStaffApiItem): StaffMember {
  return {
    id: item.id,
    entryKey: `${item.id}:${item.sort_order ?? "na"}:${item.role_name ?? ""}`,
    name: item.preferred_name || `Staff #${item.id}`,
    role: item.role_name || "Unknown",
    image: item.image?.large || item.image?.medium || "/images/avatar.jpg",
    occupations: item.primary_occupations || [],
  }
}

function emptyAnimeExtras(): AnimeExtraSections {
  return {
    relations: [],
    characters: [],
    staff: [],
  }
}

function formatMembers(popularity: number): string {
  if (popularity >= 1000000) {
    return `${(popularity / 1000000).toFixed(1)}M`
  }
  if (popularity >= 1000) {
    return `${(popularity / 1000).toFixed(1)}K`
  }
  return popularity.toString()
}
