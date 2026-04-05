# API Integration Guide

## Overview

Este proyecto usa un **servidor API Laravel** como backend y **Next.js** como frontend. La comunicación ocurre a través de endpoints REST.

## URLs de API

El frontend se comunica con el backend usando:
- **`INTERNAL_API_URL`** - Para requests desde el servidor (Server Components)
  - Dentro de contenedores Docker: `http://backend:8000`
  - En desarrollo local: `http://localhost:8000`
  
- **`NEXT_PUBLIC_API_URL`** - Para requests desde el navegador (Client Components)
  - URL pública del servidor API
  - Valor: `http://localhost:8000`

## Estructura

```
frontend/lib/
├── api-config.ts       # Configuración de endpoints
├── api/
│   ├── client.ts       # Cliente HTTP reutilizable
│   └── anime.ts        # Funciones específicas de anime
└── anime-data.ts       # Tipos e interfaces de datos
```

## Uso

### 1. Server Components (SSG/SSR)

Para obtener datos en Server Components:

```typescript
// app/anime/[slug]/page.tsx
import { fetchAnimeById } from "@/lib/api/anime"

export default async function AnimePage({ params }) {
  const anime = await fetchAnimeById(1)
  
  return (
    <div>
      <h1>{anime.title}</h1>
    </div>
  )
}
```

**Ventajas:**
- ✅ Usa `INTERNAL_API_URL` automáticamente
- ✅ Resultados cacheable para SSG/ISR
- ✅ No expone URLs internas al navegador

### 2. Client Components (CSR)

Para obtener datos en Client Components:

```typescript
// components/my-component.tsx
"use client"

import { useState, useEffect } from "react"
import { fetchAnimeById } from "@/lib/api/anime"

export function MyComponent() {
  const [anime, setAnime] = useState(null)
  
  useEffect(() => {
    fetchAnimeById(1).then(setAnime)
  }, [])
  
  return <div>{anime?.title}</div>
}
```

**Nota:** Usa `NEXT_PUBLIC_API_URL` automáticamente

### 3. Con TanStack Query

Para datos que necesiten refetch automático:

```typescript
import { useQuery } from "@tanstack/react-query"
import { fetchAnimeById } from "@/lib/api/anime"

export function AnimeDetail({ id }: { id: number }) {
  const { data: anime } = useQuery({
    queryKey: ["anime", id],
    queryFn: () => fetchAnimeById(id),
  })
  
  return <div>{anime?.title}</div>
}
```

## Endpoints Disponibles

### Anime

```typescript
// Get single anime
GET /api/v1/anime/{id}

// List anime
GET /api/v1/anime?page=1&per_page=20

// Get filters
GET /api/v1/anime/filters

// Home page data
GET /api/v1/home
```

### Authentication (Sanctum)

```typescript
// Register
POST /api/v1/auth/register
{
  "name": "John",
  "email": "john@example.com",
  "password": "password123"
}

// Login
POST /api/v1/auth/login
{
  "email": "john@example.com",
  "password": "password123"
}

// Get current user
GET /api/v1/auth/me

// Logout
POST /api/v1/auth/logout
```

## Autenticación

La autenticación usa **Laravel Sanctum** con cookies.

**El cliente HTTP automáticamente:**
- ✅ Envía `credentials: "include"` en todas las requests
- ✅ Maneja cookies de sesión automáticamente
- ✅ Funciona en Server Components y Client Components

Solo necesitas llamar a login una vez:

```typescript
"use client"

import { apiFetch } from "@/lib/api/client"

export function LoginForm() {
  async function handleLogin(email: string, password: string) {
    await apiFetch("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
    // La cookie de sesión se administra automáticamente
  }
  
  return (
    // formulario
  )
}
```

## Agregar Nuevos Endpoints

### 1. Define el tipo

```typescript
// lib/types/user.ts
export interface User {
  id: number
  name: string
  email: string
}
```

### 2. Crea funciones de API

```typescript
// lib/api/users.ts
import { apiFetch } from "@/lib/api/client"
import { API_CONFIG } from "@/lib/api-config"
import type { User } from "@/lib/types/user"

export async function fetchUser(id: number): Promise<User | null> {
  try {
    const endpoint = API_CONFIG.endpoints.user.profile(id)
    return await apiFetch<User>(endpoint)
  } catch (error) {
    console.error("Failed to fetch user:", error)
    return null
  }
}
```

### 3. Actualiza api-config.ts

```typescript
// lib/api-config.ts
endpoints: {
  // ... existing endpoints
  user: {
    profile: (id: number | string) => `/api/v1/users/${id}`,
    library: (id: number | string) => `/api/v1/users/${id}/library`,
  },
}
```

## Testing de Endpoints

Usa `curl` o Postman:

```bash
# Obtener anime
curl -i http://localhost:8000/api/v1/anime/1

# Con autenticación (después de login)
curl -i -b "cookies.txt" http://localhost:8000/api/v1/auth/me
```

## Manejo de Errores

El cliente HTTP maneja errores automáticamente:

```typescript
try {
  const anime = await fetchAnimeById(999) // No existe
  // anime será null para 404
} catch (error) {
  // Errors para otros status codes
  console.error(error.message)
}
```

## Consideraciones de Rendimiento

- ✅ Server Components cachean automáticamente con `revalidate`
- ✅ Usa ISR para contenido que cambia ocasionalmente
- ✅ TanStack Query cachea en el cliente
- ✅ Los endpoints son paginados cuando es necesario

```typescript
// Revalidar cada hora
export const revalidate = 3600

export default async function Page() {
  const anime = await fetchAnimeById(1)
  // ...
}
```

## Variables de Entorno Requeridas

```bash
# .env.local
INTERNAL_API_URL=http://backend:8000
NEXT_PUBLIC_API_URL=http://localhost:8000
```

En Docker:
- Frontend accede al backend con `http://backend:8000`
- Navegador accede con `http://localhost:8000`
