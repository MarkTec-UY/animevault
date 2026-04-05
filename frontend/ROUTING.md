# URL Routing Guide - Anime Pages

## New URL Format

Las páginas de anime ahora usan la siguiente estructura:

```
/anime/[id]/[title]
```

Ejemplo:
```
/anime/1/Cowboy-Bebop
/anime/2/Neon-Genesis-Evangelion
/anime/43/Attack-on-Titan
```

## Estructura de Carpetas

```
app/
└── anime/
    └── [id]/
        └── [title]/
            └── page.tsx
```

## Cómo Generar URLs

### Usando la función `getAnimeUrl()`

```typescript
import { getAnimeUrl } from "@/lib/utils/anime-urls"
import type { AnimeData } from "@/lib/types/anime"

const anime: AnimeData = {
  id: 1,
  title: "Cowboy Bebop",
  // ... otros campos
}

const url = getAnimeUrl(anime)
// Resultado: "/anime/1/Cowboy-Bebop"
```

### Usando `Link` en Next.js

```typescript
import Link from "next/link"
import { getAnimeUrl } from "@/lib/utils/anime-urls"

export function AnimeLink({ anime }: { anime: AnimeData }) {
  return (
    <Link href={getAnimeUrl(anime)}>
      {anime.title}
    </Link>
  )
}
```

### Usando el componente `AnimeCard`

```typescript
import { AnimeCard } from "@/components/anime/anime-card"

export function MyComponent({ anime }: { anime: AnimeData }) {
  return (
    <AnimeCard anime={anime} />
  )
}
```

## Funciones Disponibles

### `titleToSlug(title: string): string`
Convierte un título a slug URL-safe:
```typescript
titleToSlug("Cowboy Bebop")  // "cowboy-bebop"
titleToSlug("Neon Genesis Evangelion")  // "neon-genesis-evangelion"
```

### `getAnimeUrl(anime: AnimeData): string`
Genera la URL completa desde un objeto `AnimeData`:
```typescript
getAnimeUrl(anime)  // "/anime/1/Cowboy-Bebop"
```

### `getAnimeUrlFromIdAndTitle(id: number, title: string): string`
Genera la URL usando ID y título separados:
```typescript
getAnimeUrlFromIdAndTitle(1, "Cowboy Bebop")  // "/anime/1/Cowboy-Bebop"
```

## Características SEO

- ✅ URLs amigables con palabras clave (título en la URL)
- ✅ IDs numéricos para lookup rápido en BD
- ✅ Fácil de compartir y memorizar
- ✅ Estructura clara: `/recurso/[id]/[título]`

## Notas

- El parámetro `title` se usa principalmente para SEO
- El parámetro `id` es el que se usa realmente para obtener los datos
- El servidor valida que el ID existe; ignorar URLs con títulos incorrectos es seguro
- Se puede implementar una redirección 301 si el título no coincide exactamente (opcional)

## Cambios Migra

Si tienes enlaces antiguos en formato `/anime/[slug]`:

```typescript
// Viejo
/anime/1

// Nuevo
/anime/1/Cowboy-Bebop
```

Para mantener compatibilidad, se puede añadir una redirección:

```typescript
// app/anime/[slug]/page.ts (deprecated)
import { redirect } from "next/navigation"
import { fetchAnimeById } from "@/lib/api/anime"
import { getAnimeUrl } from "@/lib/utils/anime-urls"

export default async function OldAnimeRoute({ params }) {
  const { slug } = await params
  const anime = await fetchAnimeById(slug)
  
  if (anime) {
    redirect(getAnimeUrl(anime))
  }
  
  notFound()
}
```
