"use client"

import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import Link from "next/link"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Search, Zap, Filter, X } from "lucide-react"
import { useSearchAnime } from "@/hooks/use-search-anime"
import { useSearchManga } from "@/hooks/use-search-manga"
import { useAnimeFilterOptions } from "@/hooks/use-anime-filter-options"
import { useMangaFilterOptions } from "@/hooks/use-manga-filter-options"
import { Input } from "@/components/ui/input"
import { getAnimeUrlFromIdAndTitle } from "@/lib/utils/anime-urls"
import { getMangaUrlFromIdAndTitle } from "@/lib/utils/manga-urls"
import { SearchAnimeSkeleton } from "@/components/shared/search-anime-skeleton"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { AnimeFilters } from "@/lib/api/search"

/**
 * Search combo component for anime and manga
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
  const [searchType, setSearchType] = useState<"anime" | "manga">("anime")
  
  // Track previous params to sync state without useEffect
  const [prevParams, setPrevParams] = useState(() => searchParams.toString())
  const currentParamsString = searchParams.toString()

  // Sync state during render if URL changed and we are on the search page
  if ((pathname === "/anime" || pathname === "/manga") && currentParamsString !== prevParams) {
    setPrevParams(currentParamsString)
    
    const q = searchParams.get("search") || ""
    setQuery(q)
    setSearchType(pathname.startsWith("/manga") ? "manga" : "anime")
    
    const filters: Omit<AnimeFilters, "search"> = {}
    const statusParam = searchParams.get("status")
    const formatParam = searchParams.get("format")
    const seasonParam = searchParams.get("season")
    const genresParam = searchParams.get("genres")
    const yearParam = searchParams.get("year")
    
    if (statusParam) filters.status = statusParam.split(",")
    if (formatParam) filters.format = formatParam.split(",")
    if (seasonParam) filters.season = seasonParam.split(",")
    if (genresParam) filters.genres = genresParam.split(",")
    if (yearParam) filters.year = parseInt(yearParam, 10)
    
    setActiveFilters(filters)
  }
  
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { data: animeFilterOptions } = useAnimeFilterOptions()
  const { data: mangaFilterOptions } = useMangaFilterOptions()

  const searchFilters = useMemo(() => ({
    search: query,
    ...activeFilters
  }), [query, activeFilters])

  const { data: animeResults, isLoading: isAnimeLoading, isError: isAnimeError } = useSearchAnime(searchFilters, 5)
  const { data: mangaResults, isLoading: isMangaLoading, isError: isMangaError } = useSearchManga(searchFilters, 5)

  const isLoading = isAnimeLoading || isMangaLoading
  const hasSearchError = isAnimeError || isMangaError
  const filterOptions = searchType === "manga" ? mangaFilterOptions : animeFilterOptions
  const animeFilterSectionOptions = searchType === "anime" ? animeFilterOptions : undefined
  const animeResultCount = animeResults?.length ?? 0
  const mangaResultCount = mangaResults?.length ?? 0
  const hasAnyResults = animeResultCount > 0 || mangaResultCount > 0

  const activeFilterCount = useMemo(() => {
    return Object.values(activeFilters).filter(v => v !== undefined && v !== null && (Array.isArray(v) ? v.length > 0 : true)).length
  }, [activeFilters])
  const shouldShowEmptyResults = !hasAnyResults && (query.length > 0 || activeFilterCount > 0)

  const handleSearch = useCallback((e?: React.FormEvent) => {
    e?.preventDefault()
    if (!query && activeFilterCount === 0) return

    const params = new URLSearchParams()
    if (query) params.set("search", query)
    
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value && Array.isArray(value) && value.length > 0) {
        params.set(key, value.join(","))
      } else if (typeof value === "number") {
        params.set(key, value.toString())
      }
    })

    setIsOpen(false)
    router.push(`/${searchType}?${params.toString()}`)
  }, [query, activeFilters, activeFilterCount, router, searchType])

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
    if (pathname === "/anime" || pathname === "/manga") {
      router.push(pathname)
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

  const toggleYearFilter = (year: number) => {
    setActiveFilters(prev => ({
      ...prev,
      year: prev.year === year ? undefined : year,
    }))
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
            placeholder={`Buscar ${searchType === "anime" ? "anime" : "manga"}...`}
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
            aria-label="Buscar"
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
          <PopoverContent className="w-80 p-0 overflow-hidden" align="end">
            <div className="p-4 border-b border-border">
              <Tabs value={searchType} onValueChange={(v) => setSearchType(v as "anime" | "manga")} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="anime">Anime</TabsTrigger>
                  <TabsTrigger value="manga">Manga</TabsTrigger>
                </TabsList>
              </Tabs>
              <h4 className="font-medium leading-none">Filtros</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Refina tu búsqueda de {searchType}
              </p>
            </div>
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-4 space-y-6">
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

                {animeFilterSectionOptions?.seasons && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Season</p>
                    <div className="flex flex-wrap gap-2">
                      {animeFilterSectionOptions.seasons.map((season) => (
                        <Badge 
                          key={season.code}
                          variant={isFilterActive("season", season.code) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => toggleFilter("season", season.code)}
                        >
                          {season.description}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {filterOptions?.years && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Year</p>
                    <div className="flex flex-wrap gap-2">
                      {filterOptions.years.map(year => (
                        <Badge 
                          key={year}
                          variant={activeFilters.year === year ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => toggleYearFilter(year)}
                        >
                          {year}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
            </div>
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
          ) : (
            <div className="max-h-96 overflow-y-auto custom-scrollbar">
              {hasAnyResults ? (
                <>
              {/* Anime Results */}
              {animeResults && animeResults.length > 0 && (
                <div>
                  <div className="bg-muted/50 px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border">
                    Anime
                  </div>
                  <ul>
                    {animeResults.map((anime) => (
                      <li key={anime.id}>
                        <Link
                          href={getAnimeUrlFromIdAndTitle(anime.id, anime.title)}
                          onClick={handleSelect}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-secondary transition-colors border-b border-border last:border-0"
                        >
                          <img
                            src={anime.poster}
                            alt={anime.title}
                            width={40}
                            height={56}
                            className="rounded object-cover bg-muted shrink-0"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{anime.title}</p>
                            <p className="text-xs text-muted-foreground">{anime.year} • {anime.type}</p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Manga Results */}
              {mangaResults && mangaResults.length > 0 && (
                <div>
                  <div className="bg-muted/50 px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border">
                    Manga
                  </div>
                  <ul>
                    {mangaResults.map((manga) => (
                      <li key={manga.id}>
                        <Link
                          href={getMangaUrlFromIdAndTitle(manga.id, manga.title)}
                          onClick={handleSelect}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-secondary transition-colors border-b border-border last:border-0"
                        >
                          <img
                            src={manga.poster}
                            alt={manga.title}
                            width={40}
                            height={56}
                            className="rounded object-cover bg-muted shrink-0"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{manga.title}</p>
                            <p className="text-xs text-muted-foreground">{manga.year} • {manga.type}</p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
                </>
              ) : hasSearchError ? (
                <div className="flex items-center justify-center gap-2 px-4 py-8 text-destructive">
                  <Zap className="w-4 h-4" />
                  <span className="text-sm">No hemos podido completar la búsqueda ahora mismo</span>
                </div>
              ) : shouldShowEmptyResults ? (
                <div className="flex items-center justify-center gap-2 px-4 py-8 text-muted-foreground">
                  <Zap className="w-4 h-4" />
                  <span className="text-sm">No se encontraron resultados</span>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
