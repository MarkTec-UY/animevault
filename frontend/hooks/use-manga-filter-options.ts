"use client"

import { useQuery } from "@tanstack/react-query"
import { API_CONFIG } from "@/lib/api-config"
import { apiFetch } from "@/lib/api/client"
import type { FilterOption, SortOption } from "./use-anime-filter-options"

export interface MangaFilterOptions {
  formats: FilterOption[]
  statuses: FilterOption[]
  sources: FilterOption[]
  genres: string[]
  years: number[]
  sort_options: SortOption[]
}

/**
 * Hook to fetch available manga filter options from the backend
 */
export function useMangaFilterOptions() {
  return useQuery<MangaFilterOptions>({
    queryKey: ["manga", "filter-options"],
    queryFn: () => apiFetch<MangaFilterOptions>(API_CONFIG.endpoints.manga.filters),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  })
}
