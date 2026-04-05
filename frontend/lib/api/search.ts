import { API_CONFIG } from "@/lib/api-config"
import { apiFetch } from "./client"
import type { AnimeApiResponse } from "./anime"

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
 * Search anime by title or ID from the backend API
 */
export async function searchAnime(query: string, limit: number = 10): Promise<AnimeApiResponse[]> {
  if (!query.trim()) {
    return []
  }

  try {
    const endpoint = `${API_CONFIG.endpoints.anime.list}?search=${encodeURIComponent(query)}&per_page=${limit}`
    const data = await apiFetch<SearchAnimeResponse>(endpoint)
    return data.data || []
  } catch (error) {
    console.error(`Failed to search anime for query "${query}":`, error)
    
    // Log the current API URL for debugging
    if (typeof window !== "undefined") {
      console.debug(`API URL: ${API_CONFIG.baseUrl}`)
    }
    
    return []
  }
}
