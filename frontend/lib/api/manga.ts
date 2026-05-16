import { API_CONFIG } from "@/lib/api-config"
import { apiFetch } from "@/lib/api/client"
import type { MangaData, RelatedMedia } from "@/lib/types/manga"
import type { Character, StaffMember } from "@/lib/types/anime"

export interface MangaApiResponse {
  id: number
  preferred_title?: string
  titles?: {
    romaji?: string
    english?: string
    native?: string
  }
  description?: string
  cover_image?: {
    color?: string
    large?: string
  }
  banner_image?: string
  format?: {
    code?: string
    description?: string
  } | string
  chapters?: number
  volumes?: number
  status?: {
    code?: string
    description?: string
  } | string
  start_date?: string
  end_date?: string
  source?: {
    code?: string
    description?: string
  } | string
  average_score?: number
  popularity?: number
  favourites?: number
  is_adult?: boolean
  genres?: string[]
  tags?: Array<{
    id?: number
    name?: string
    description?: string
    category?: string
    rank?: number
  }>
  [key: string]: unknown
}

interface MediaApiResponse<T> {
  data: T[]
}

interface MediaReferenceApi {
  code?: string
  description?: string | null
}

interface MangaRelationApiItem {
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

interface MangaCharacterApiItem {
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

interface MangaStaffApiItem {
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

interface FetchMangaOptions {
  includeExtras?: boolean
}

interface MangaExtraSections {
  relations: MangaRelationApiItem[]
  characters: MangaCharacterApiItem[]
  staff: MangaStaffApiItem[]
}

export async function fetchMangaById(
  id: number | string,
  options: FetchMangaOptions = {},
): Promise<MangaData | null> {
  try {
    const endpoint = API_CONFIG.endpoints.manga.show(id)
    const data = await fetchApi<MangaApiResponse>(endpoint)
    const extras =
      options.includeExtras === false
        ? emptyMangaExtras()
        : await fetchMangaExtras(id)

    return transformApiResponseToMangaData(data, extras)
  } catch (error) {
    console.error(`Failed to fetch manga ${id}:`, error)
    return null
  }
}

export function transformApiResponseToMangaData(
  apiData: MangaApiResponse,
  extras: MangaExtraSections = emptyMangaExtras(),
): MangaData {
  const title =
    apiData.preferred_title ||
    apiData.titles?.romaji ||
    apiData.titles?.english ||
    "Unknown"
  const jaTitle = apiData.titles?.native || ""

  const poster = apiData.cover_image?.large || "/images/anime-1.jpg"
  const banner = apiData.banner_image || "/images/anime-banner.jpg"

  const format =
    typeof apiData.format === "string"
      ? apiData.format
      : apiData.format?.code || "Unknown"

  const status =
    typeof apiData.status === "string"
      ? apiData.status
      : apiData.status?.code || "Unknown"

  const source =
    typeof apiData.source === "string"
      ? apiData.source
      : apiData.source?.code || "Unknown"

  let score = apiData.average_score || 0
  if (score > 10) {
    score = score / 10
  }

  let year = new Date().getFullYear()
  if (apiData.start_date) {
    year = new Date(apiData.start_date).getFullYear()
  }

  return {
    id: apiData.id,
    slug: `manga-${apiData.id}`,
    title,
    jaTitle,
    banner,
    poster,
    synopsis: apiData.description || "",
    score,
    rank: 0,
    popularity: apiData.popularity || 0,
    members: formatMembers(apiData.popularity || 0),
    type: format,
    chapters: apiData.chapters || 0,
    volumes: apiData.volumes || 0,
    year,
    status,
    source,
    is_adult: !!apiData.is_adult,
    genres: apiData.genres || [],
    themes: (apiData.tags || []).map((tag) => tag.name || "").filter(Boolean),
    characters: extras.characters.map(transformMangaCharacter),
    staff: extras.staff.map(transformMangaStaff),
    reviews: [],
    related: extras.relations.map(transformMangaRelation),
    scoreBreakdown: [],
  }
}

async function fetchMangaExtras(id: number | string): Promise<MangaExtraSections> {
  const [relationsResult, charactersResult, staffResult] = await Promise.allSettled([
    fetchApi<MediaApiResponse<MangaRelationApiItem>>(API_CONFIG.endpoints.manga.relations(id)),
    fetchApi<MediaApiResponse<MangaCharacterApiItem>>(API_CONFIG.endpoints.manga.characters(id)),
    fetchApi<MediaApiResponse<MangaStaffApiItem>>(API_CONFIG.endpoints.manga.staff(id)),
  ])

  return {
    relations: unwrapSection(relationsResult, "manga relations"),
    characters: unwrapSection(charactersResult, "manga characters"),
    staff: unwrapSection(staffResult, "manga staff"),
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

function transformMangaRelation(item: MangaRelationApiItem): RelatedMedia {
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
    mediaType: item.type?.code === "ANIME" ? "ANIME" : "MANGA",
  }
}

function transformMangaCharacter(item: MangaCharacterApiItem): Character {
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

function transformMangaStaff(item: MangaStaffApiItem): StaffMember {
  return {
    id: item.id,
    entryKey: `${item.id}:${item.sort_order ?? "na"}:${item.role_name ?? ""}`,
    name: item.preferred_name || `Staff #${item.id}`,
    role: item.role_name || "Unknown",
    image: item.image?.large || item.image?.medium || "/images/avatar.jpg",
    occupations: item.primary_occupations || [],
  }
}

function emptyMangaExtras(): MangaExtraSections {
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
