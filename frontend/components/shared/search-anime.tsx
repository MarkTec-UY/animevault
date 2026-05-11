"use client"

import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Search, Zap, Filter, X } from "lucide-react"
import { useSearchAnime } from "@/hooks/use-search-anime"
import { useAnimeFilterOptions } from "@/hooks/use-anime-filter-options"
import { Input } from "@/components/ui/input"
import { getAnimeUrlFromIdAndTitle } from "@/lib/utils/anime-urls"
import { SearchAnimeSkeleton } from "@/components/shared/search-anime-skeleton"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { AnimeFilters } from "@/lib/api/search"

/**
 * Search combo component for anime
 * Provides autocomplete search with results dropdown and dynamic filters
 */
export function SearchAnime() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const [query, setQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [activeFilters, setActiveFilters] = useState<Omit<AnimeFilters, "search">>({})
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  
  // Track previous params to sync state without useEffect
  const [prevParams, setPrevParams] = useState(() => searchParams.toString())
  const currentParamsString = searchParams.toString()

  // Sync state during render if URL changed and we are on the search page
  if (pathname === "/anime" && currentParamsString !== prevParams) {
    setPrevParams(currentParamsString)
    
    const q = searchParams.get("search") || ""
    setQuery(q)
    
    const filters: Omit<AnimeFilters, "search"> = {}
    const statusParam = searchParams.get("status")
    const formatParam = searchParams.get("format")
    const genresParam = searchParams.get("genres")
    
    if (statusParam) filters.status = statusParam.split(",")
    if (formatParam) filters.format = formatParam.split(",")
    if (genresParam) filters.genres = genresParam.split(",")
    
    setActiveFilters(filters)
  }
  
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { data: filterOptions } = useAnimeFilterOptions()

  const searchFilters = useMemo(() => ({
    search: query,
    ...activeFilters
  }), [query, activeFilters])

  const { data: results, isLoading } = useSearchAnime(searchFilters, 8)

  const activeFilterCount = useMemo(() => {
    return Object.values(activeFilters).filter(v => v !== undefined && v !== null && (Array.isArray(v) ? v.length > 0 : true)).length
  }, [activeFilters])

  const handleSearch = useCallback((e?: React.FormEvent) => {
    e?.preventDefault()
    if (!query && activeFilterCount === 0) return

    const params = new URLSearchParams()
    if (query) params.set("search", query)
    
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value && Array.isArray(value) && value.length > 0) {
        params.set(key, value.join(","))
      }
    })

    setIsOpen(false)
    router.push(`/anime?${params.toString()}`)
  }, [query, activeFilters, activeFilterCount, router])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = useCallback(() => {
    setQuery("")
    setIsOpen(false)
  }, [])

  const handleClear = useCallback(() => {
    setQuery("")
    setActiveFilters({})
    if (pathname === "/anime") {
      router.push("/anime")
    }
    inputRef.current?.focus()
  }, [pathname, router])

  const toggleFilter = (type: keyof Omit<AnimeFilters, "search">, value: string) => {
    setActiveFilters(prev => {
      const current = prev[type] as string[] | undefined
      if (!current) return { ...prev, [type]: [value] }
      
      if (current.includes(value)) {
        const next = current.filter(v => v !== value)
        return { ...prev, [type]: next.length > 0 ? next : undefined }
      }
      
      return { ...prev, [type]: [...current, value] }
    })
  }

  const isFilterActive = (type: keyof Omit<AnimeFilters, "search">, value: string) => {
    const current = activeFilters[type] as string[] | undefined
    return current?.includes(value) ?? false
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      <form onSubmit={handleSearch} className="relative flex items-center gap-2">
        <div className="relative flex-1 flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            placeholder="Buscar anime..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setIsOpen(e.target.value.length > 0 || activeFilterCount > 0)
            }}
            onFocus={() => (query.length > 0 || activeFilterCount > 0) && setIsOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch()
              }
            }}
            className="pl-9 pr-9 bg-secondary border-border text-sm"
            aria-label="Buscar anime"
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 p-1 hover:bg-muted rounded transition-colors"
              aria-label="Limpiar búsqueda"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button 
              type="button"
              variant="outline" 
              size="icon" 
              className={`relative bg-secondary border-border ${activeFilterCount > 0 ? "text-primary border-primary/50" : "text-muted-foreground"}`}
              title="Filtros"
            >
              <Filter className="w-4 h-4" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="p-4 border-b border-border">
              <h4 className="font-medium leading-none">Filtros</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Refina tu búsqueda de anime
              </p>
            </div>
            <ScrollArea className="h-[400px] custom-scrollbar">
              <div className="p-4 space-y-6">
                {/* Genres */}
                {filterOptions?.genres && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Géneros</p>
                    <div className="flex flex-wrap gap-2">
                      {filterOptions.genres.map(genre => (
                        <Badge 
                          key={genre}
                          variant={isFilterActive("genres", genre) ? "default" : "outline"}
                          className="cursor-pointer"
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
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estado</p>
                    <div className="flex flex-wrap gap-2">
                      {filterOptions.statuses.map(status => (
                        <Badge 
                          key={status.code}
                          variant={isFilterActive("status", status.code) ? "default" : "outline"}
                          className="cursor-pointer"
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
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Formato</p>
                    <div className="flex flex-wrap gap-2">
                      {filterOptions.formats.map(format => (
                        <Badge 
                          key={format.code}
                          variant={isFilterActive("format", format.code) ? "default" : "outline"}
                          className="cursor-pointer"
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
            <div className="p-2 border-t border-border bg-muted/30 flex gap-2">
              {activeFilterCount > 0 && (
                <Button 
                  type="button"
                  variant="ghost" 
                  size="sm" 
                  className="flex-1 text-xs" 
                  onClick={() => setActiveFilters({})}
                >
                  Limpiar
                </Button>
              )}
              <Button 
                type="submit"
                variant="default" 
                size="sm" 
                className="flex-1 text-xs"
                onClick={() => setIsFilterOpen(false)}
              >
                Aplicar
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </form>

      {/* Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl shadow-black/40 overflow-hidden z-50">
          {isLoading ? (
            <div className="max-h-96 overflow-y-auto custom-scrollbar">
              <SearchAnimeSkeleton />
            </div>
          ) : results && results.length > 0 ? (
            <ul className="max-h-96 overflow-y-auto custom-scrollbar">
              {results.map((anime) => {
                const title = anime.title
                const poster = anime.poster
                const year = anime.year

                return (
                  <li key={anime.id}>
                    <Link
                      href={getAnimeUrlFromIdAndTitle(anime.id, title)}
                      onClick={handleSelect}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-secondary transition-colors border-b border-border last:border-0"
                    >
                      {/* Poster */}
                      <Image
                        src={poster}
                        alt={title}
                        width={48}
                        height={64}
                        className="rounded object-cover bg-muted shrink-0"
                      />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{title}</p>
                        {year && (
                          <p className="text-xs text-muted-foreground">{year}</p>
                        )}
                      </div>

                      {/* Format Badge */}
                      {anime.type && (
                        <div className="inline-flex px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium shrink-0">
                          {anime.type.substring(0, 3).toUpperCase()}
                        </div>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          ) : (query.length > 0 || activeFilterCount > 0) ? (
            <div className="flex items-center justify-center gap-2 px-4 py-8 text-muted-foreground">
              <Zap className="w-4 h-4" />
              <span className="text-sm">No se encontraron resultados</span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
