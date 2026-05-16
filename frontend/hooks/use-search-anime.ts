"use client"

import { useQuery, useInfiniteQuery } from "@tanstack/react-query"
import { searchAnime, type AnimeFilters } from "@/lib/api/search"
import { transformApiResponseToAnimeData } from "@/lib/api/anime"
import type { AnimeData } from "@/lib/types/anime"

/**
 * Custom hook for searching anime with filters
 * Uses React Query to cache and manage search results
 */
export function useSearchAnime(filters: AnimeFilters | string, limit: number = 10) {
  const normalizedFilters = typeof filters === "string" ? { search: filters } : filters
  const { search, ...restFilters } = normalizedFilters

  return useQuery<AnimeData[]>({
    queryKey: ["search", "anime", { search, ...restFilters, limit }],
    queryFn: async () => {
      const response = await searchAnime(filters, limit)
      return response.data.map((item) => transformApiResponseToAnimeData(item))
    },
    enabled: Boolean(search && search.length > 0) || Object.keys(restFilters).length > 0,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Custom hook for infinite anime search
 * Supports pagination and dynamic filters
 */
export function useInfiniteSearchAnime(filters: AnimeFilters, firstPageLimit: number = 18, subsequentPageLimit: number = 12) {
  const { search, ...restFilters } = filters

  return useInfiniteQuery({
    queryKey: ["search", "anime", "infinite", { search, ...restFilters, firstPageLimit, subsequentPageLimit }],
    queryFn: async ({ pageParam = 1 }) => {
      const perPage = pageParam === 1 ? firstPageLimit : subsequentPageLimit
      const response = await searchAnime({ ...filters, page: pageParam, per_page: perPage })
      
      return {
        data: response.data.map((item) => transformApiResponseToAnimeData(item)),
        meta: response.meta
      }
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.current_page < lastPage.meta.last_page) {
        return lastPage.meta.current_page + 1
      }
      return undefined
    },
    initialPageParam: 1,
    staleTime: 30 * 1000,
  })
}
