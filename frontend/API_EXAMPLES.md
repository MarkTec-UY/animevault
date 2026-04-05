# Ejemplos de Integración API

## 1. Server Component - SSG (Datos estáticos)

```typescript
// app/anime/[slug]/page.tsx
import { fetchAnimeById } from "@/lib/api/anime"
import { AnimeHero } from "@/components/anime/anime-hero"

interface PageProps {
  params: Promise<{ slug: string }>
}

// Revalidar cada 24 horas
export const revalidate = 86400

export default async function AnimePage({ params }: PageProps) {
  const { slug } = await params
  const animeId = parseInt(slug, 10)
  
  if (isNaN(animeId)) {
    return <div>Not found</div>
  }

  const anime = await fetchAnimeById(animeId)

  if (!anime) {
    return <div>Anime not found</div>
  }

  return (
    <div>
      <AnimeHero anime={anime} />
      {/* resto del contenido */}
    </div>
  )
}
```

## 2. Client Component - CSR con Skeleton

```typescript
// app/anime/[slug]/anime-details.tsx
"use client"

import { useAnime } from "@/hooks/use-anime"
import { AnimeHero } from "@/components/anime/anime-hero"
import { AnimeHeroSkeleton } from "@/components/anime/anime-hero-skeleton"

interface AnimeDetailsProps {
  initialId: number
}

export function AnimeDetails({ initialId }: AnimeDetailsProps) {
  const { data: anime, isLoading } = useAnime(initialId)

  if (isLoading) {
    return <AnimeHeroSkeleton />
  }

  if (!anime) {
    return <div>Could not load anime</div>
  }

  return (
    <div>
      <AnimeHero anime={anime} />
    </div>
  )
}
```

## 3. Form con Mutación (Add to List)

```typescript
// components/anime/add-to-list-button.tsx
"use client"

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api/client"
import { Button } from "@/components/ui/button"

interface AddToListButtonProps {
  animeId: number
}

export function AddToListButton({ animeId }: AddToListButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const queryClient = useQueryClient()

  const handleAddToList = async () => {
    setIsLoading(true)
    try {
      await apiFetch(`/api/v1/me/library/${animeId}`, {
        method: "PUT",
        body: JSON.stringify({
          status: "WATCHING",
        }),
      })

      // Invalidar la lista de usuario
      await queryClient.invalidateQueries({
        queryKey: ["user", "library"],
      })
    } catch (error) {
      console.error("Failed to add anime to list:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleAddToList} disabled={isLoading}>
      {isLoading ? "Adding..." : "Add to List"}
    </Button>
  )
}
```

## 4. Lista de Animes con Paginación

```typescript
// components/anime/anime-list.tsx
"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api/client"
import type { AnimeData } from "@/lib/types/anime"

interface AnimeListResponse {
  data: AnimeData[]
  meta: {
    total: number
    per_page: number
    current_page: number
    last_page: number
  }
}

export function AnimeList() {
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ["anime", "list", page],
    queryFn: async () => {
      return apiFetch<AnimeListResponse>(
        `/api/v1/anime?page=${page}&per_page=20`
      )
    },
  })

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-4">
        {data?.data.map((anime) => (
          <div key={anime.id}>
            <h3>{anime.title}</h3>
            <p>{anime.synopsis}</p>
          </div>
        ))}
      </div>

      {/* Paginación */}
      <div className="mt-8 flex gap-4">
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          Anterior
        </button>
        <span>
          Página {page} de {data?.meta.last_page}
        </span>
        <button
          disabled={page === data?.meta.last_page}
          onClick={() => setPage(page + 1)}
        >
          Siguiente
        </button>
      </div>
    </div>
  )
}
```

## 5. Búsqueda en Tiempo Real

```typescript
// components/anime/anime-search.tsx
"use client"

import { useState, useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api/client"
import type { AnimeData } from "@/lib/types/anime"
import { useDebouncedValue } from "@/hooks/use-debounced-value"

export function AnimeSearch() {
  const [query, setQuery] = useState("")
  const debouncedQuery = useDebouncedValue(query, 300)

  const { data: results } = useQuery({
    queryKey: ["anime", "search", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) return []
      return apiFetch<AnimeData[]>(
        `/api/v1/anime?search=${encodeURIComponent(debouncedQuery)}`
      )
    },
    enabled: debouncedQuery.length > 1,
  })

  return (
    <div>
      <input
        type="text"
        placeholder="Search anime..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {results && results.length > 0 && (
        <ul>
          {results.map((anime) => (
            <li key={anime.id}>{anime.title}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

## 6. Obtener Datos Autenticados

```typescript
// hooks/use-current-user.ts
import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api/client"

interface User {
  id: number
  name: string
  email: string
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["user", "me"],
    queryFn: async () => {
      try {
        return await apiFetch<User>("/api/v1/auth/me")
      } catch (error) {
        // Si no está autenticado, devolver null
        return null
      }
    },
    retry: false,
  })
}

// Uso en componente
"use client"

import { useCurrentUser } from "@/hooks/use-current-user"

export function UserProfile() {
  const { data: user } = useCurrentUser()

  if (!user) {
    return <div>Not logged in</div>
  }

  return <div>Welcome, {user.name}!</div>
}
```

## Patrones Comunes

### ✅ Loading State Apropiado

```typescript
const { data, isLoading, isPending } = useQuery(...)

if (isLoading) return <Skeleton /> // Primer load
if (isPending) return <Spinner />  // Refetch
```

### ✅ Invalidación de Cache

```typescript
const queryClient = useQueryClient()

// Después de una mutación
await queryClient.invalidateQueries({
  queryKey: ["anime", id],
})

// O revalidar múltiples keys
await queryClient.refetchQueries({
  queryKey: ["anime"],
})
```

### ✅ Optimistic Updates

```typescript
const { mutate } = useMutation({
  mutationFn: (data) => apiFetch("/api/v1/favorites", { ... }),
  onMutate: async (newData) => {
    // Actualizar UI antes de que responda el servidor
    await queryClient.cancelQueries({ queryKey: ["favorites"] })
    const previous = queryClient.getQueryData(["favorites"])
    queryClient.setQueryData(["favorites"], (old) => [
      ...old,
      newData
    ])
    return { previous }
  },
  onError: (err, newData, context) => {
    // Revertir si algo falla
    queryClient.setQueryData(["favorites"], context?.previous)
  },
})
```

## Debug

Para ver qué queries están en cache:

```typescript
// En consola del navegador
import { useQueryClient } from "@tanstack/react-query"

const queryClient = useQueryClient()
console.log(queryClient.getQueryCache().findAll())
```
