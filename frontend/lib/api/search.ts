import { API_CONFIG } from "@/lib/api-config"
import { apiFetch } from "./client"
import type { AnimeApiResponse } from "./anime"

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

export interface SearchAnimeResponse {
  data: AnimeApiResponse[]
  meta: {
    current_page: number
    from: number
    last_page: number
    per_page: number
    to: number
    total: number
  }
}

/**
 * Search anime with advanced filters from the backend API
 */
export async function searchAnime(filters: AnimeFilters | string, limit: number = 10): Promise<AnimeApiResponse[]> {
  // Handle legacy string query
  const searchParams = typeof filters === "string" 
    ? { search: filters, per_page: limit } 
    : { ...filters, per_page: filters.per_page || limit }

  if (searchParams.search && !searchParams.search.trim() && Object.keys(searchParams).length === 1) {
    return []
  }

  try {
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
    const data = await apiFetch<SearchAnimeResponse>(endpoint)
    return data.data || []
  } catch (error) {
    console.error(`Failed to search anime:`, error)
    return []
  }
}
