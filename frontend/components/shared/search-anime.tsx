"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Search, Zap } from "lucide-react"
import { useSearchAnime } from "@/hooks/use-search-anime"
import { Input } from "@/components/ui/input"
import { getAnimeUrlFromIdAndTitle } from "@/lib/utils/anime-urls"
import { SearchAnimeSkeleton } from "@/components/shared/search-anime-skeleton"

/**
 * Search combo component for anime
 * Provides autocomplete search with results dropdown
 */
export function SearchAnime() {
  const [query, setQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { data: results, isLoading } = useSearchAnime(query, 8)

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
    inputRef.current?.focus()
  }, [])

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          placeholder="Buscar anime..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(e.target.value.length > 0)
          }}
          onFocus={() => query.length > 0 && setIsOpen(true)}
          className="pl-9 pr-9 bg-secondary border-border text-sm"
          aria-label="Buscar anime"
          autoComplete="off"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 p-1 hover:bg-muted rounded transition-colors"
            aria-label="Limpiar búsqueda"
          >
            <svg className="w-4 h-4 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl shadow-black/40 overflow-hidden z-50">
          {isLoading ? (
            <div className="max-h-96 overflow-y-auto">
              <SearchAnimeSkeleton />
            </div>
          ) : results && results.length > 0 ? (
            <ul className="max-h-96 overflow-y-auto">
              {results.map((anime) => {
                const title =
                  anime.preferred_title ||
                  anime.titles?.romaji ||
                  anime.titles?.english ||
                  "Unknown"
                const poster =
                  anime.cover_image?.large ||
                  anime.cover?.image?.large ||
                  "/images/anime-default.jpg"
                const year =
                  anime.startDate?.year ||
                  (anime.start_date ? new Date(anime.start_date).getFullYear() : null)

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
                      {anime.format && (
                        <div className="inline-flex px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium shrink-0">
                          {typeof anime.format === "string"
                            ? anime.format.substring(0, 3).toUpperCase()
                            : anime.format.code?.substring(0, 3).toUpperCase()}
                        </div>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          ) : query.length > 0 ? (
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
