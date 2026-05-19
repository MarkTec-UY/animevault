"use client"

import { useQuery, useInfiniteQuery } from "@tanstack/react-query"
import { searchManga, type MangaFilters } from "@/lib/api/search"
import { transformApiResponseToMangaData } from "@/lib/api/manga"
import type { MangaData } from "@/lib/types/manga"

/**
 * Custom hook for searching manga with filters
 * Uses React Query to cache and manage search results
 */
export function useSearchManga(filters: MangaFilters | string, limit: number = 10) {
  const normalizedFilters = typeof filters === "string" ? { search: filters } : filters
  const { search, ...restFilters } = normalizedFilters

  return useQuery<MangaData[]>({
    queryKey: ["search", "manga", { search, ...restFilters, limit }],
    queryFn: async () => {
      const response = await searchManga(filters, limit)
      return response.data.map((item) => transformApiResponseToMangaData(item))
    },
    enabled: Boolean(search && search.length > 0) || Object.keys(restFilters).length > 0,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Custom hook for infinite manga search
 * Supports pagination and dynamic filters
 */
export function useInfiniteSearchManga(filters: MangaFilters, firstPageLimit: number = 18, subsequentPageLimit: number = 12) {
  const { search, ...restFilters } = filters
  const stablePageSize = Math.max(firstPageLimit, subsequentPageLimit)

  return useInfiniteQuery({
    queryKey: ["search", "manga", "infinite", { search, ...restFilters, firstPageLimit, subsequentPageLimit }],
    queryFn: async ({ pageParam = 1 }) => {
      // Offset pagination needs a stable page size; changing per_page between
      // page 1 and page 2 causes overlapping windows and repeated manga.
      const response = await searchManga({ ...filters, page: pageParam, per_page: stablePageSize })
      
      return {
        data: response.data.map((item) => transformApiResponseToMangaData(item)),
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
