"use client"

import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useCallback, useMemo, useEffect, useState } from "react"
import { useInView } from "react-intersection-observer"
import { motion, AnimatePresence } from "motion/react"
import { useInfiniteSearchAnime } from "@/hooks/use-search-anime"
import { useAnimeFilterOptions } from "@/hooks/use-anime-filter-options"
import { AnimeCard } from "@/components/anime/anime-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, X, Zap, Loader2, SlidersHorizontal, ArrowUp } from "lucide-react"
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
  const { ref, inView } = useInView({
    threshold: 0.1,
    rootMargin: "200px",
  })

  const [showScrollTop, setShowScrollTop] = useState(false)

  // Listen to scroll for scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

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

  const { 
    data, 
    isLoading, 
    isFetchingNextPage, 
    fetchNextPage, 
    hasNextPage,
    isError 
  } = useInfiniteSearchAnime(filters, 18, 12)

  const { data: filterOptions } = useAnimeFilterOptions()

  // Load more when reaching the bottom
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  const allAnimes = useMemo(() => {
    return data?.pages.flatMap(page => page.data) ?? []
  }, [data])

  const totalResults = data?.pages[0]?.meta.total ?? 0

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
    
    params.delete("page")
    router.push(`${pathname}?${params.toString()}`)
  }, [pathname, router, searchParams])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="container max-w-7xl mx-auto pt-24 pb-12 px-4 md:px-6 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl md:text-5xl font-bold tracking-tight text-gradient-green pb-1"
          >
            Explorar Anime
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-lg max-w-2xl"
          >
            Navega por el catálogo completo. Filtra por género, estado, formato y más.
          </motion.p>
        </div>
        
        {totalResults > 0 && !isLoading && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="hidden md:block"
          >
            <Badge variant="secondary" className="px-4 py-1.5 text-sm font-medium bg-secondary/50 backdrop-blur-md border-border/50 rounded-full">
              {totalResults.toLocaleString()} resultados
            </Badge>
          </motion.div>
        )}
      </div>

      {/* Sticky Search Bar Container */}
      <div className="sticky top-16 z-40 -mx-4 px-4 py-4 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm transition-all duration-300">
        <div className="flex flex-col sm:flex-row gap-4 items-center max-w-5xl mx-auto">
          <div className="relative flex-1 group w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="¿Qué quieres ver hoy?..."
              value={filters.search || ""}
              onChange={handleSearchChange}
              className="pl-12 h-12 text-lg bg-secondary/40 border-border/50 focus:bg-background transition-all rounded-2xl shadow-sm focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="lg" className="h-12 px-6 gap-3 rounded-2xl border-border/50 hover:bg-secondary transition-all flex-1 sm:flex-none font-semibold">
                  <SlidersHorizontal className="w-4 h-4" />
                  Filtros
                  {activeFilterCount > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold shadow-lg shadow-primary/20">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col border-l border-border/50 shadow-2xl">
                <SheetHeader className="p-8 border-b border-border/50 bg-secondary/30">
                  <SheetTitle className="text-2xl font-bold">Filtros Avanzados</SheetTitle>
                  <SheetDescription className="text-base text-muted-foreground">
                    Refina tu búsqueda para encontrar el anime perfecto.
                  </SheetDescription>
                </SheetHeader>
                
                <ScrollArea className="flex-1 p-8 custom-scrollbar">
                  <div className="space-y-10 pb-8">
                    {/* Sort Options */}
                    {filterOptions?.sort_options && (
                      <div className="space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">Ordenar por</h3>
                        <div className="flex flex-wrap gap-2">
                          {filterOptions.sort_options.map(option => (
                            <Badge 
                              key={option.value}
                              variant={filters.sort === option.value || (!filters.sort && option.value === "popularity_desc") ? "default" : "outline"}
                              className="cursor-pointer px-4 py-2 text-sm rounded-xl transition-all border-border/50"
                              onClick={() => updateFilters({ sort: option.value })}
                            >
                              {option.label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Genres */}
                    {filterOptions?.genres && (
                      <div className="space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">Géneros</h3>
                        <div className="flex flex-wrap gap-2">
                          {filterOptions.genres.map(genre => (
                            <Badge 
                              key={genre}
                              variant={isFilterActive("genres", genre) ? "default" : "outline"}
                              className="cursor-pointer px-4 py-2 text-sm rounded-xl transition-all border-border/50"
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
                        <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">Estado</h3>
                        <div className="flex flex-wrap gap-2">
                          {filterOptions.statuses.map(status => (
                            <Badge 
                              key={status.code}
                              variant={isFilterActive("status", status.code) ? "default" : "outline"}
                              className="cursor-pointer px-4 py-2 text-sm rounded-xl transition-all border-border/50"
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
                        <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">Formato</h3>
                        <div className="flex flex-wrap gap-2">
                          {filterOptions.formats.map(format => (
                            <Badge 
                              key={format.code}
                              variant={isFilterActive("format", format.code) ? "default" : "outline"}
                              className="cursor-pointer px-4 py-2 text-sm rounded-xl transition-all border-border/50"
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

                <SheetFooter className="p-8 border-t border-border/50 bg-background/50 backdrop-blur-md flex-row gap-3 sm:space-x-0">
                  <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold border-border/50 hover:bg-secondary" onClick={clearFilters}>
                    Limpiar
                  </Button>
                  <Button className="flex-1 h-12 rounded-xl font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90" onClick={() => {}}>
                    Aplicar filtros
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>

            {activeFilterCount > 0 && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-12 w-12 rounded-2xl hover:bg-destructive/10 hover:text-destructive transition-colors hidden sm:flex border border-border/50"
                onClick={clearFilters}
                title="Limpiar filtros"
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Active Filter Chips */}
      <AnimatePresence>
        {activeFilterCount > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-wrap gap-2 items-center px-2"
          >
            <span className="text-sm font-semibold text-muted-foreground mr-2">Filtros activos:</span>
            {Object.entries(filters).map(([key, value]) => {
              if (!value || key === "search") return null
              if (Array.isArray(value)) {
                return value.map(v => (
                  <Badge key={`${key}-${v}`} variant="secondary" className="gap-2 px-3 py-1.5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors rounded-full font-medium">
                    {v}
                    <X 
                      className="w-3.5 h-3.5 cursor-pointer hover:scale-110 transition-transform" 
                      onClick={() => toggleFilter(key as keyof AnimeFilters, v)}
                    />
                  </Badge>
                ))
              }
              if (key === "sort") return null
              return (
                <Badge key={key} variant="secondary" className="gap-2 px-3 py-1.5 bg-primary/10 text-primary border-primary/20 rounded-full font-medium">
                  {value}
                  <X 
                    className="w-3.5 h-3.5 cursor-pointer hover:scale-110 transition-transform" 
                    onClick={() => updateFilters({ [key]: undefined })}
                  />
                </Badge>
              )
            })}
            <Button variant="ghost" size="sm" className="h-8 text-xs font-bold hover:bg-destructive/10 hover:text-destructive rounded-full px-4" onClick={clearFilters}>
              Borrar todo
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content Grid */}
      <div className="space-y-12">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-10 md:gap-x-6">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="aspect-[2/3] rounded-3xl bg-secondary/40 animate-pulse relative overflow-hidden border border-border/50">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                </div>
                <div className="space-y-2 px-1">
                  <div className="h-5 w-full bg-secondary/40 animate-pulse rounded-lg" />
                  <div className="h-4 w-2/3 bg-secondary/40 animate-pulse rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 bg-destructive/5 rounded-[3rem] border border-destructive/10">
            <div className="w-20 h-20 rounded-3xl bg-destructive/10 flex items-center justify-center">
              <Zap className="w-10 h-10 text-destructive" />
            </div>
            <div className="space-y-2 px-4">
              <h3 className="text-2xl font-bold">Vaya, algo ha salido mal</h3>
              <p className="text-muted-foreground max-w-sm mx-auto text-lg">
                No hemos podido cargar el catálogo. Por favor, inténtalo de nuevo más tarde.
              </p>
            </div>
            <Button variant="outline" size="lg" className="rounded-xl px-8 border-destructive/20 hover:bg-destructive/10" onClick={() => window.location.reload()}>
              Reintentar
            </Button>
          </div>
        ) : allAnimes.length > 0 ? (
          <>
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.03 } }
              }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-12 md:gap-x-6"
            >
              {allAnimes.map((anime, index) => (
                <motion.div
                  key={`${anime.id}-${index}`}
                  variants={{
                    hidden: { opacity: 0, scale: 0.9, y: 30 },
                    visible: { opacity: 1, scale: 1, y: 0 }
                  }}
                  whileHover={{ y: -8 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                >
                  <AnimeCard anime={anime} />
                </motion.div>
              ))}
            </motion.div>

            {/* Load More Indicator / Infinite Scroll Ref */}
            <div ref={ref} className="flex justify-center py-24">
              {isFetchingNextPage ? (
                <div className="flex flex-col items-center gap-6">
                  <div className="relative h-16 w-16">
                    <Loader2 className="w-16 h-16 animate-spin text-primary opacity-20" />
                    <Loader2 className="w-16 h-16 animate-spin text-primary absolute inset-0 [animation-duration:1.5s]" />
                    <div className="absolute inset-0 blur-2xl bg-primary/30 rounded-full animate-pulse" />
                  </div>
                  <p className="text-primary font-bold text-lg tracking-wide animate-pulse uppercase">Actualizando catálogo...</p>
                </div>
              ) : hasNextPage ? (
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={() => fetchNextPage()}
                  className="rounded-2xl px-16 h-16 border-primary/20 hover:bg-primary/5 hover:text-primary transition-all font-bold text-lg shadow-xl hover:shadow-primary/10"
                >
                  Cargar más contenido
                </Button>
              ) : (
                <div className="flex flex-col items-center gap-3 py-12 w-full">
                  <div className="h-px w-full max-w-md bg-gradient-to-r from-transparent via-border/50 to-transparent" />
                  <p className="text-muted-foreground font-semibold text-lg italic">Has llegado al final del universo ✨</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-32 text-center space-y-8 bg-secondary/10 rounded-[4rem] border-2 border-dashed border-border/30 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
            <div className="w-28 h-28 rounded-[2rem] bg-background shadow-2xl flex items-center justify-center relative overflow-hidden group rotate-3 hover:rotate-0 transition-transform duration-500">
              <Zap className="w-14 h-14 text-muted-foreground group-hover:text-primary transition-colors z-10" />
              <div className="absolute inset-0 bg-primary/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            </div>
            <div className="space-y-4 px-6 relative z-10">
              <h3 className="text-4xl font-black tracking-tight">Cero coincidencias</h3>
              <p className="text-muted-foreground max-w-md mx-auto text-xl leading-relaxed font-medium">
                No hemos encontrado ningún anime que coincida con tus filtros. ¿Quizás una búsqueda más amplia?
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-4 relative z-10">
              <Button variant="default" size="lg" className="rounded-2xl px-12 h-16 text-lg font-bold shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all" onClick={clearFilters}>
                Reiniciar búsqueda
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Floating Scroll to Top */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 100 }}
            onClick={scrollToTop}
            className="fixed bottom-10 right-10 z-50 p-5 rounded-3xl bg-primary text-primary-foreground shadow-2xl shadow-primary/40 hover:scale-110 active:scale-90 transition-all group"
          >
            <ArrowUp className="w-7 h-7 group-hover:-translate-y-1 transition-transform" />
            <div className="absolute inset-0 rounded-3xl bg-primary animate-ping opacity-20 pointer-events-none" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
