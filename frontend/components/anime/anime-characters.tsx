"use client"

import { useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import type { Character } from "@/lib/types/anime"
import { Button } from "@/components/ui/button"

interface AnimeCharactersProps {
  characters: Character[]
  isManga?: boolean
}

const INITIAL_VISIBLE = 6

export function AnimeCharacters({ characters, isManga = false }: AnimeCharactersProps) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE)

  const visibleCharacters = characters.slice(0, visibleCount)
  const hasMore = visibleCount < characters.length

  if (characters.length === 0) {
    return (
      <section className="space-y-4">
        <h2 className="font-serif text-2xl text-foreground">Characters</h2>
        <div className="rounded-2xl border border-dashed border-border/70 bg-card/40 px-6 py-12 text-center text-sm text-muted-foreground">
          Character information is not available yet for this title.
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <h2 className="font-serif text-2xl text-foreground">Characters</h2>

      <div className={cn(
        "grid gap-3",
        isManga ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 lg:grid-cols-2"
      )}>
        {visibleCharacters.map((char) => {
          const primaryVA =
            char.voiceActors?.find((va) => va.language === "Japanese") ||
            char.voiceActors?.[0]

          return (
            <article
              key={`${char.id}:${primaryVA?.id ?? "no-va"}:${char.role}`}
              className="group flex h-[100px] overflow-hidden rounded-lg bg-card border border-border hover:border-primary/30 transition-all duration-200"
            >
              {/* Character image */}
              <div className="relative w-[70px] shrink-0 overflow-hidden">
                <Image
                  src={char.image}
                  alt={char.name}
                  fill
                  sizes="70px"
                  className="object-cover object-top"
                />
              </div>

              {/* Character info */}
              <div className="flex flex-col justify-between py-2.5 px-3 min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                  {char.name}
                </p>
                <span className={cn(
                  "text-[11px] font-medium w-fit",
                  char.role.toLowerCase().includes("main")
                    ? "text-primary"
                    : "text-muted-foreground"
                )}>
                  {char.role}
                </span>
              </div>

              {/* Voice actor info (anime only) */}
              {!isManga && primaryVA && (
                <>
                  <div className="flex flex-col justify-between py-2.5 px-3 min-w-0 text-right">
                    <p className="text-sm font-medium text-foreground leading-tight line-clamp-2">
                      {primaryVA.name}
                    </p>
                    <span className="text-[11px] text-muted-foreground">
                      {primaryVA.language ?? "Unknown"}
                    </span>
                  </div>

                  {/* Voice actor image */}
                  <div className="relative w-[70px] shrink-0 overflow-hidden">
                    <Image
                      src={primaryVA.image}
                      alt={primaryVA.name}
                      fill
                      sizes="70px"
                      className="object-cover object-top"
                    />
                  </div>
                </>
              )}
            </article>
          )
        })}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setVisibleCount((c) => c + INITIAL_VISIBLE)}
            className="rounded-full border-border bg-card px-6 hover:border-primary/30 hover:text-primary"
          >
            Show more characters
          </Button>
        </div>
      )}
    </section>
  )
}
