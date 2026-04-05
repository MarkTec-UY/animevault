import { useQuery, UseQueryResult } from "@tanstack/react-query"
import { fetchAnimeById } from "@/lib/api/anime"
import type { AnimeData } from "@/lib/types/anime"

/**
 * Hook para obtener datos de un anime específico
 * Cachea los datos y permite refetching
 *
 * @param id - ID del anime
 * @param options - Opciones de react-query
 * @returns Resultado de la query
 *
 * @example
 * ```typescript
 * const { data: anime, isLoading, error } = useAnime(1)
 * ```
 */
export function useAnime(
  id: number | null | undefined,
  options?: Partial<Omit<UseQueryResult, "data" | "error">>,
): UseQueryResult<AnimeData | null, Error> {
  return useQuery({
    queryKey: ["anime", id],
    queryFn: async () => {
      if (!id) return null
      return fetchAnimeById(id)
    },
    enabled: !!id, // Solo ejecutar si hay ID
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 30, // 30 minutos (antes era cacheTime)
    ...options,
  })
}

/**
 * Hook para obtener múltiples animes
 *
 * @param ids - Array de IDs
 * @returns Array de resultados
 *
 * @example
 * ```typescript
 * const results = useAnimes([1, 2, 3])
 * ```
 */
export function useAnimes(ids: number[] = []) {
  return useQuery({
    queryKey: ["anime", "batch", ids],
    queryFn: async () => {
      const results = await Promise.all(ids.map((id) => fetchAnimeById(id)))
      return results.filter((anime) => anime !== null)
    },
    enabled: ids.length > 0,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  })
}
