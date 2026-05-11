"use client"

import { useQuery } from "@tanstack/react-query"
import { API_CONFIG } from "@/lib/api-config"
import { apiFetch } from "@/lib/api/client"

export interface FilterOption {
  code: string
  description: string
}

export interface SortOption {
  value: string
  label: string
}

export interface AnimeFilterOptions {
  formats: FilterOption[]
  statuses: FilterOption[]
  seasons: FilterOption[]
  sources: FilterOption[]
  genres: string[]
  years: number[]
  sort_options: SortOption[]
}

/**
 * Hook to fetch available anime filter options from the backend
 */
export function useAnimeFilterOptions() {
  return useQuery<AnimeFilterOptions>({
    queryKey: ["anime", "filter-options"],
    queryFn: () => apiFetch<AnimeFilterOptions>(API_CONFIG.endpoints.anime.filters),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours, as these options don't change often
  })
}
