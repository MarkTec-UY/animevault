"use client"

import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { sanitizeHtml } from "@/lib/utils/text"
import { AnimeCharacters } from "@/components/anime/anime-characters"
import { AnimeEpisodes } from "@/components/anime/anime-episodes"
import { AnimeStaff } from "@/components/anime/anime-staff"
import { AnimeReviews } from "@/components/anime/anime-reviews"
import { AnimeRelated } from "@/components/anime/anime-related"
import { AnimeTrailer } from "@/components/anime/anime-trailer"
import type { AnimeData } from "@/lib/types/anime"

interface AnimeTabsProps {
  anime: AnimeData
}

type Tab = "Overview" | "Episodes" | "Characters" | "Staff" | "Reviews" | "Related" | "Trailer"

export function AnimeTabs({ anime }: AnimeTabsProps) {
  const availableTabs = useMemo(() => {
    const allTabs: Tab[] = ["Overview", "Episodes", "Characters", "Staff", "Reviews", "Related", "Trailer"]
    return allTabs.filter(tab => {
      if (tab === "Episodes") return (anime.episodes_list?.length ?? 0) > 0
      if (tab === "Reviews") return (anime.reviews?.length ?? 0) > 0
      if (tab === "Trailer") return anime.trailer !== null
      return true
    })
  }, [anime.episodes_list, anime.reviews, anime.trailer])

  const [active, setActive] = useState<Tab>("Overview")

  const currentTab = availableTabs.includes(active) ? active : "Overview"

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="sticky top-16 z-30 bg-background/90 backdrop-blur-md border-b border-border -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
        <nav className="flex gap-0 overflow-x-auto scrollbar-hide" aria-label="Anime sections">
          {availableTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActive(tab)}
              className={cn(
                "px-4 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                currentTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div>
        {currentTab === "Overview" && (
          <div className="space-y-8">
            {/* Synopsis */}
            <section className="space-y-3">
              <h2 className="font-serif text-2xl text-foreground">Synopsis</h2>
              <p
                className="text-muted-foreground leading-relaxed text-sm sm:text-base"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(anime.synopsis) }}
              />
            </section>

            {/* Trailer preview in overview */}
            {anime.trailer && (
              <AnimeTrailer trailer={anime.trailer} title={anime.title} />
            )}

            {/* Characters preview */}
            <AnimeCharacters characters={anime.characters} />
          </div>
        )}
        {currentTab === "Episodes" && <AnimeEpisodes episodes={anime.episodes_list} />}
        {currentTab === "Characters" && <AnimeCharacters characters={anime.characters} />}
        {currentTab === "Staff" && <AnimeStaff staff={anime.staff} />}
        {currentTab === "Reviews" && <AnimeReviews reviews={anime.reviews} averageScore={anime.score} />}
        {currentTab === "Related" && <AnimeRelated related={anime.related} />}
        {currentTab === "Trailer" && anime.trailer && (
          <AnimeTrailer trailer={anime.trailer} title={anime.title} />
        )}
      </div>
    </div>
  )
}
