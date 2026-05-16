"use client"

import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { sanitizeHtml } from "@/lib/utils/text"
import { AnimeCharacters } from "@/components/anime/anime-characters"
import { AnimeStaff } from "@/components/anime/anime-staff"
import { AnimeReviews } from "@/components/anime/anime-reviews"
import { AnimeRelated } from "@/components/anime/anime-related"
import type { MangaData } from "@/lib/types/manga"

interface MangaTabsProps {
  manga: MangaData
}

type Tab = "Overview" | "Characters" | "Staff" | "Reviews" | "Related"

export function MangaTabs({ manga }: MangaTabsProps) {
  const availableTabs = useMemo(() => {
    const allTabs: Tab[] = ["Overview", "Characters", "Staff", "Reviews", "Related"]
    return allTabs.filter(tab => {
      if (tab === "Reviews") return (manga.reviews?.length ?? 0) > 0
      return true
    })
  }, [manga.reviews])

  const [active, setActive] = useState<Tab>("Overview")

  // Ensure active tab is always available
  const currentTab = availableTabs.includes(active) ? active : "Overview"

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="sticky top-16 z-30 bg-background/90 backdrop-blur-md border-b border-border -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
        <nav className="flex gap-0 overflow-x-auto scrollbar-hide" aria-label="Manga sections">
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
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(manga.synopsis) }}
              />
            </section>
            
            {/* Characters preview */}
            <AnimeCharacters characters={manga.characters} isManga={true} />
          </div>
        )}
        {currentTab === "Characters" && <AnimeCharacters characters={manga.characters} isManga={true} />}
        {currentTab === "Staff" && <AnimeStaff staff={manga.staff} />}
        {currentTab === "Reviews" && <AnimeReviews reviews={manga.reviews} averageScore={manga.score} />}
        {currentTab === "Related" && <AnimeRelated related={manga.related} />}
      </div>
    </div>
  )
}
