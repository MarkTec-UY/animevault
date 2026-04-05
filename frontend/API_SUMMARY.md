# Integración API - Resumen de Cambios

## 📁 Estructura de Archivos Creados

```
frontend/
├── lib/
│   ├── api-config.ts           ✨ NUEVO - Configuración de endpoints
│   ├── api/
│   │   ├── client.ts           ✨ NUEVO - Cliente HTTP reutilizable
│   │   └── anime.ts            ✨ NUEVO - Funciones específicas de anime
│   └── anime-data.ts           📝 EXISTENTE (tipos)
│
├── hooks/
│   └── use-anime.ts            ✨ NUEVO - Hooks para React Query
│
├── app/
│   └── anime/
│       └── [slug]/
│           └── page.tsx        📝 MODIFICADO - Ahora trae del backend
│
└── docs/
    ├── API_INTEGRATION.md      ✨ NUEVO - Guía completa
    └── API_EXAMPLES.md         ✨ NUEVO - Ejemplos de uso

```

## 🚀 Cambios Principales

### 1. **api-config.ts** - Configuración centralizada
```typescript
// Define todos los endpoints en un lugar
// Usa automáticamente INTERNAL_API_URL (server) o NEXT_PUBLIC_API_URL (client)

API_CONFIG.endpoints.anime.show(1)  // "/api/v1/anime/1"
API_CONFIG.getUrl(endpoint)         // "http://localhost:8000/api/v1/anime/1"
```

### 2. **api/client.ts** - Cliente HTTP inteligente
```typescript
// Maneja automáticamente:
// ✅ JSON parsing
// ✅ Errores y 404s
// ✅ Headers de autenticación
// ✅ Cookies (Sanctum)

await apiFetch<T>(endpoint, options)
await fetchJson<T>(endpoint, options)  // Devuelve null en 404
```

### 3. **api/anime.ts** - Funciones de dominio
```typescript
// Funciones específicas para anime
// Transforman respuesta API a tipos locales

await fetchAnimeById(1)        // Devuelve AnimeData | null
await fetchAnimeBySlug("1")    // Vía ID numérico
```

### 4. **hooks/use-anime.ts** - Hooks React Query
```typescript
// Integración con TanStack Query
// Cachea automáticamente

const { data: anime } = useAnime(1)
const results = useAnimes([1, 2, 3])
```

### 5. **app/anime/[slug]/page.tsx** - Página actualizada
```typescript
// Ahora es hybrid:
// 1. Intenta traer del backend (API)
// 2. Falls back a datos estáticos si no existe
// 3. Genera SSG/ISR automáticamente

async function getAnime(slug: string) {
  const apiAnime = await fetchAnimeById(id)
  if (apiAnime) return apiAnime
  return getAnimeBySlug(slug)  // Static fallback
}
```

## 📡 Flujo de Datos

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Frontend                          │
├──────────────────────────┬──────────────────────────────────┤
│                          │                                   │
│  Server Components       │      Client Components            │
│  (SSR/SSG)              │      (CSR)                        │
│                          │                                   │
│  fetchAnimeById() ──────┼──> apiFetch() + useAnime()       │
│  ↓                       │      ↓                            │
│  INTERNAL_API_URL        │      NEXT_PUBLIC_API_URL         │
│  (http://backend:8000)   │      (http://localhost:8000)    │
│                          │                                   │
└──────────────────────────┴──────────────────────────────────┘
         │                                   │
         └───────────────────┬───────────────┘
                             ↓
                  ┌──────────────────────┐
                  │   Laravel Backend    │
                  │  /api/v1/anime/{id}  │
                  └──────────────────────┘
```

## 🔄 Casos de Uso

### Caso 1: Página SSG de Anime
```typescript
// Server Component - Se genera en build time
export const revalidate = 86400  // Revalidar cada 24h

const anime = await fetchAnimeById(1)  // Server-side
// HTML estático + cache en navegador
```

### Caso 2: Widget Dinámico
```typescript
// Client Component - Se fetcha en el navegador
"use client"
const { data: anime } = useAnime(1)  // Client-side
// Cachea automáticamente en TanStack Query
```

### Caso 3: Lista con Paginación
```typescript
// Client Component con TanStack Query
const [page, setPage] = useState(1)
const { data } = useQuery({
  queryKey: ["anime", page],
  queryFn: () => apiFetch(`/api/v1/anime?page=${page}`)
})
```

## 🔐 Seguridad & Autenticación

**Sanctum Cookie-Based Auth:**
- ✅ `apiFetch()` envía automáticamente `credentials: "include"`
- ✅ Cookies se manejan automáticamente en el navegador
- ✅ No necesitas manualmente pasar tokens
- ✅ Works en Server y Client Components

```typescript
// Login
await apiFetch("/api/v1/auth/login", {
  method: "POST",
  body: JSON.stringify({ email, password })
})
// Cookie se guarda automáticamente

// Requests subsecuentes llevan la cookie automáticamente
const user = await apiFetch("/api/v1/auth/me")
```

## 📊 Variables de Entorno

```bash
# .env.local
INTERNAL_API_URL=http://backend:8000   # Para Server Components
NEXT_PUBLIC_API_URL=http://localhost:8000  # Para navegador
```

```yaml
# docker-compose.yml
environment:
  INTERNAL_API_URL: http://backend:8000
  NEXT_PUBLIC_API_URL: http://localhost:8000
```

## ✅ Checklist de Uso

- [x] Crear `api-config.ts` - Configuración centralizada
- [x] Crear `api/client.ts` - Cliente HTTP
- [x] Crear `api/anime.ts` - Funciones anime
- [x] Crear `hooks/use-anime.ts` - Hooks React Query
- [x] Actualizar `page.tsx` - Página dinámico
- [x] Documentar en `API_INTEGRATION.md`
- [x] Ejemplos en `API_EXAMPLES.md`
- [ ] Agregar más endpoints según sea necesario
- [ ] Crear tests para funciones de API
- [ ] Documentar respuestas del backend

## 🔧 Próximos Pasos

1. **Backend:** Asegurar que `/api/v1/anime/{id}` devuelve datos completos
2. **Frontend:** Agregar endpoints para:
   - `/api/v1/anime` (lista con filters)
   - `/api/v1/anime/filters`
   - Más datos en el anime (personajes, episodios, etc.)
3. **Tests:** Crear tests para funciones API
4. **Documentación:** Agregar tipos TS para cada endpoint

## 📚 Referencias

- `API_INTEGRATION.md` - Guía técnica completa
- `API_EXAMPLES.md` - Ejemplos prácticos
- `AGENTS.md` - Reglas del frontend (Next.js)
- `docker-compose.yml` - Configuración de servicios
