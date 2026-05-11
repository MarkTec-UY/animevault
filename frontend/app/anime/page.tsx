"use client"

import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useCallback, useMemo } from "react"
import { useSearchAnime } from "@/hooks/use-search-anime"
import { useAnimeFilterOptions } from "@/hooks/use-anime-filter-options"
import { AnimeCard } from "@/components/anime/anime-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, X, Zap } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { AnimeFilters } from "@/lib/api/search"

export default function AnimeSearchPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Extract filters from URL
  const filters = useMemo(() => {
    const params: AnimeFilters = {}
    
    if (searchParams.get("search")) params.search = searchParams.get("search")!
    if (searchParams.get("status")) params.status = searchParams.get("status")!.split(",")
    if (searchParams.get("format")) params.format = searchParams.get("format")!.split(",")
    if (searchParams.get("genres")) params.genres = searchParams.get("genres")!.split(",")
    if (searchParams.get("year")) params.year = parseInt(searchParams.get("year")!, 10)
    if (searchParams.get("sort")) params.sort = searchParams.get("sort")!
    
    return params
  }, [searchParams])

  const { data: results, isLoading, isFetching } = useSearchAnime(filters, 20)
  const { data: filterOptions } = useAnimeFilterOptions()

  const updateFilters = useCallback((newFilters: Partial<AnimeFilters>) => {
    const params = new URLSearchParams(searchParams.toString())
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) {
        params.delete(key)
      } else if (Array.isArray(value)) {
        params.set(key, value.join(","))
      } else {
        params.set(key, value.toString())
      }
    })
    
    // Reset page when filters change
    params.delete("page")
    
    router.push(`${pathname}?${params.toString()}`)
  }, [pathname, router, searchParams])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Debounce would be better here, but for simplicity:
    const value = e.target.value
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set("search", value)
    } else {
      params.delete("search")
    }
    router.replace(`${pathname}?${params.toString()}`)
  }

  const toggleFilter = (type: keyof AnimeFilters, value: string) => {
    const current = (filters[type] as string[]) || []
    if (current.includes(value)) {
      updateFilters({ [type]: current.filter(v => v !== value) })
    } else {
      updateFilters({ [type]: [...current, value] })
    }
  }

  const isFilterActive = (type: keyof AnimeFilters, value: string) => {
    const current = (filters[type] as string[]) || []
    return current.includes(value)
  }

  const clearFilters = () => {
    router.push(pathname)
  }

  const activeFilterCount = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { search: _search, ...rest } = filters
    return Object.values(rest).filter(v => v !== undefined && v !== null && (Array.isArray(v) ? v.length > 0 : true)).length
  }, [filters])

  return (
    <div className="container py-8 space-y-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Explorar Anime</h1>
        <p className="text-muted-foreground">
          Descubre miles de animes usando nuestros filtros avanzados.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 sticky top-16 z-30 bg-background/95 backdrop-blur py-4 -mx-4 px-4 border-b border-border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título..."
            value={filters.search || ""}
            onChange={handleSearchChange}
            className="pl-10 h-11"
          />
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="lg" className="h-11 gap-2">
              <Filter className="w-4 h-4" />
              Filtros
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 min-w-[20px] justify-center">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
            <SheetHeader className="p-6 border-b border-border">
              <SheetTitle>Filtros Avanzados</SheetTitle>
              <SheetDescription>
                Ajusta los parámetros para encontrar exactamente lo que buscas.
              </SheetDescription>
            </SheetHeader>
            
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-8 pb-8">
                {/* Genres */}
                {filterOptions?.genres && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Géneros</h3>
                    <div className="flex flex-wrap gap-2">
                      {filterOptions.genres.map(genre => (
                        <Badge 
                          key={genre}
                          variant={isFilterActive("genres", genre) ? "default" : "outline"}
                          className="cursor-pointer px-3 py-1 text-sm"
                          onClick={() => toggleFilter("genres", genre)}
                        >
                          {genre}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status */}
                {filterOptions?.statuses && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Estado</h3>
                    <div className="flex flex-wrap gap-2">
                      {filterOptions.statuses.map(status => (
                        <Badge 
                          key={status.code}
                          variant={isFilterActive("status", status.code) ? "default" : "outline"}
                          className="cursor-pointer px-3 py-1 text-sm"
                          onClick={() => toggleFilter("status", status.code)}
                        >
                          {status.description}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Format */}
                {filterOptions?.formats && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Formato</h3>
                    <div className="flex flex-wrap gap-2">
                      {filterOptions.formats.map(format => (
                        <Badge 
                          key={format.code}
                          variant={isFilterActive("format", format.code) ? "default" : "outline"}
                          className="cursor-pointer px-3 py-1 text-sm"
                          onClick={() => toggleFilter("format", format.code)}
                        >
                          {format.description}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <SheetFooter className="p-6 border-t border-border bg-muted/30 flex-row gap-2 sm:space-x-0">
              <Button variant="outline" className="flex-1" onClick={clearFilters}>
                Limpiar
              </Button>
              <Button className="flex-1" onClick={() => {}}>
                Ver resultados
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">Filtros activos:</span>
          {Object.entries(filters).map(([key, value]) => {
            if (!value || key === "search") return null
            if (Array.isArray(value)) {
              return value.map(v => (
                <Badge key={`${key}-${v}`} variant="secondary" className="gap-1 px-2 py-1">
                  {v}
                  <X 
                    className="w-3 h-3 cursor-pointer hover:text-destructive" 
                    onClick={() => toggleFilter(key as keyof AnimeFilters, v)}
                  />
                </Badge>
              ))
            }
            return (
              <Badge key={key} variant="secondary" className="gap-1 px-2 py-1">
                {value}
                <X 
                  className="w-3 h-3 cursor-pointer hover:text-destructive" 
                  onClick={() => updateFilters({ [key]: undefined })}
                />
              </Badge>
            )
          })}
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearFilters}>
            Limpiar todo
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-[3/4] rounded-xl bg-muted animate-pulse" />
              <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
              <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      ) : results && results.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {results.map((anime) => (
              <AnimeCard key={anime.id} anime={anime} />
            ))}
          </div>
          {isFetching && (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Zap className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">No se encontraron resultados</h3>
            <p className="text-muted-foreground max-w-xs mx-auto">
              Prueba a cambiar tus términos de búsqueda o ajustar los filtros.
            </p>
          </div>
          <Button variant="outline" onClick={clearFilters}>
            Limpiar filtros
          </Button>
        </div>
      )}
    </div>
  )
}
