"use client"

import { useQuery } from "@tanstack/react-query"
import { searchAnime } from "@/lib/api/search"
import type { AnimeApiResponse } from "@/lib/api/anime"

/**
 * Custom hook for searching anime
 * Uses React Query to cache and manage search results
 */
export function useSearchAnime(query: string, limit: number = 10) {
  return useQuery<AnimeApiResponse[]>({
    queryKey: ["search", "anime", query, limit],
    queryFn: () => searchAnime(query, limit),
    enabled: query.length > 0,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}
