import { API_CONFIG } from "@/lib/api-config"
import { apiFetch } from "./client"
import type { AnimeApiResponse } from "./anime"
import type { MangaApiResponse } from "./manga"

export interface AnimeFilters {
  search?: string
  status?: string | string[]
  format?: string | string[]
  season?: string | string[]
  source?: string | string[]
  genres?: string | string[]
  year?: number
  is_adult?: boolean
  sort?: string
  per_page?: number
  page?: number
}

export type MangaFilters = Omit<AnimeFilters, "season">

export interface SearchAnimeResponse {
  data: AnimeApiResponse[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    sort?: string
    filters?: Record<string, unknown>
  }
}

export interface SearchMangaResponse {
  data: MangaApiResponse[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    sort?: string
    filters?: Record<string, unknown>
  }
}

/**
 * Search anime with advanced filters from the backend API
 */
export async function searchAnime(filters: AnimeFilters | string, limit: number = 10): Promise<SearchAnimeResponse> {
  const searchParams = typeof filters === "string" 
    ? { search: filters, per_page: limit } 
    : { ...filters, per_page: filters.per_page || limit }

  if (searchParams.search && !searchParams.search.trim() && Object.keys(searchParams).length === 1) {
    return { data: [], meta: { current_page: 1, last_page: 1, per_page: limit, total: 0 } }
  }

  const queryParams = new URLSearchParams()
  
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return
    
    if (Array.isArray(value)) {
      queryParams.append(key, value.join(","))
    } else {
      queryParams.append(key, value.toString())
    }
  })

  const endpoint = `${API_CONFIG.endpoints.anime.list}?${queryParams.toString()}`
  return apiFetch<SearchAnimeResponse>(endpoint)
}

/**
 * Search manga with advanced filters from the backend API
 */
export async function searchManga(filters: MangaFilters | string, limit: number = 10): Promise<SearchMangaResponse> {
  const searchParams = typeof filters === "string" 
    ? { search: filters, per_page: limit } 
    : { ...filters, per_page: filters.per_page || limit }

  if (searchParams.search && !searchParams.search.trim() && Object.keys(searchParams).length === 1) {
    return { data: [], meta: { current_page: 1, last_page: 1, per_page: limit, total: 0 } }
  }

  const queryParams = new URLSearchParams()
  
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return
    
    if (Array.isArray(value)) {
      queryParams.append(key, value.join(","))
    } else {
      queryParams.append(key, value.toString())
    }
  })

  const endpoint = `${API_CONFIG.endpoints.manga.list}?${queryParams.toString()}`
  return apiFetch<SearchMangaResponse>(endpoint)
}
