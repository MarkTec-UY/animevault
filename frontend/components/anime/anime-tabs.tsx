"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { sanitizeHtml } from "@/lib/utils/text"
import { AnimeCharacters } from "@/components/anime/anime-characters"
import { AnimeEpisodes } from "@/components/anime/anime-episodes"
import { AnimeStaff } from "@/components/anime/anime-staff"
import { AnimeReviews } from "@/components/anime/anime-reviews"
import { AnimeRelated } from "@/components/anime/anime-related"
import type { AnimeData } from "@/lib/types/anime"

interface AnimeTabsProps {
  anime: AnimeData
}

const tabs = ["Overview", "Episodes", "Characters", "Staff", "Reviews", "Related"] as const
type Tab = (typeof tabs)[number]

export function AnimeTabs({ anime }: AnimeTabsProps) {
  const [active, setActive] = useState<Tab>("Overview")

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="sticky top-16 z-30 bg-background/90 backdrop-blur-md border-b border-border -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
        <nav className="flex gap-0 overflow-x-auto scrollbar-hide" aria-label="Anime sections">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActive(tab)}
              className={cn(
                "px-4 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                active === tab
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
        {active === "Overview" && (
          <div className="space-y-6">
            {/* Synopsis */}
            <section className="space-y-3">
              <h2 className="font-serif text-2xl text-foreground">Synopsis</h2>
              <p
                className="text-muted-foreground leading-relaxed text-sm sm:text-base"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(anime.synopsis) }}
              />
            </section>
            {/* Characters preview */}
            <AnimeCharacters characters={anime.characters} />
          </div>
        )}
        {active === "Episodes" && <AnimeEpisodes episodes={anime.episodes_list} />}
        {active === "Characters" && <AnimeCharacters characters={anime.characters} />}
        {active === "Staff" && <AnimeStaff staff={anime.staff} />}
        {active === "Reviews" && <AnimeReviews reviews={anime.reviews} averageScore={anime.score} />}
        {active === "Related" && <AnimeRelated related={anime.related} />}
      </div>
    </div>
  )
}
