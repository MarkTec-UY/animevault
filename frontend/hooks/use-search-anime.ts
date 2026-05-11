"use client"

import { useQuery } from "@tanstack/react-query"
import { searchAnime, type AnimeFilters } from "@/lib/api/search"
import type { AnimeApiResponse } from "@/lib/api/anime"

/**
 * Custom hook for searching anime with filters
 * Uses React Query to cache and manage search results
 */
export function useSearchAnime(filters: AnimeFilters | string, limit: number = 10) {
  const normalizedFilters = typeof filters === "string" ? { search: filters } : filters
  const { search, ...restFilters } = normalizedFilters

  return useQuery<AnimeApiResponse[]>({
    queryKey: ["search", "anime", { search, ...restFilters, limit }],
    queryFn: () => searchAnime(filters, limit),
    enabled: Boolean(search && search.length > 0) || Object.keys(restFilters).length > 0,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}
