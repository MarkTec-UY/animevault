"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { sanitizeHtml } from "@/lib/utils/text"
import { AnimeCharacters } from "@/components/anime/anime-characters"
import { AnimeStaff } from "@/components/anime/anime-staff"
import { AnimeRelated } from "@/components/anime/anime-related"
import type { MangaData } from "@/lib/types/manga"

interface MangaTabsProps {
  manga: MangaData
}

const tabs = ["Overview", "Characters", "Staff", "Reviews", "Related"] as const
type Tab = (typeof tabs)[number]

export function MangaTabs({ manga }: MangaTabsProps) {
  const [active, setActive] = useState<Tab>("Overview")

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="sticky top-16 z-30 bg-background/90 backdrop-blur-md border-b border-border -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
        <nav className="flex gap-0 overflow-x-auto scrollbar-hide" aria-label="Manga sections">
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
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(manga.synopsis) }}
              />
            </section>
            <AnimeCharacters characters={manga.characters} />
          </div>
        )}
        {active === "Characters" && <AnimeCharacters characters={manga.characters} />}
        {active === "Staff" && <AnimeStaff staff={manga.staff} />}
        {active === "Reviews" && (
          <div className="py-20 text-center">
            <p className="text-muted-foreground">Reviews coming soon.</p>
          </div>
        )}
        {active === "Related" && <AnimeRelated related={manga.related} />}
      </div>
    </div>
  )
}
