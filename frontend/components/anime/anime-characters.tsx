"use client"

import { useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import type { Character } from "@/lib/types/anime"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface AnimeCharactersProps {
  characters: Character[]
  isManga?: boolean
}

const INITIAL_VISIBLE_CHARACTERS = 6

export function AnimeCharacters({ characters, isManga = false }: AnimeCharactersProps) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_CHARACTERS)

  const visibleCharacters = characters.slice(0, visibleCount)
  const hasMoreCharacters = visibleCount < characters.length

  if (characters.length === 0) {
    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl text-foreground">Characters</h2>
        </div>
        <div className="rounded-2xl border border-dashed border-border/70 bg-card/40 px-6 py-12 text-center text-sm text-muted-foreground">
          Character information is not available yet for this title.
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl text-foreground">Characters</h2>
      </div>
      <div className={cn(
        "grid gap-4 md:grid-cols-2",
        isManga ? "lg:grid-cols-3 xl:grid-cols-4" : "lg:grid-cols-2 xl:grid-cols-3"
      )}>
        {visibleCharacters.map((char) => {
          const primaryVoiceActor =
            char.voiceActors?.find((voiceActor) => voiceActor.language === "Japanese") ||
            char.voiceActors?.[0]

          return (
            <article
              key={`${char.id}:${primaryVoiceActor?.id ?? "no-va"}:${char.role}`}
              className="group overflow-hidden rounded-2xl border border-border/70 bg-card/70 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-xl hover:shadow-black/20"
            >
              <div className="flex min-h-28 h-full">
                {/* Character Image */}
                <div className="relative w-20 shrink-0 overflow-hidden border-r border-border/60 sm:w-24">
                  <Image
                    src={char.image}
                    alt={char.name}
                    fill
                    sizes="(max-width: 640px) 80px, 96px"
                    className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                <div className={cn(
                  "flex-1 bg-[linear-gradient(135deg,rgba(14,23,40,0.96),rgba(18,31,52,0.92))]",
                  !isManga && "grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
                )}>
                  {/* Character Info */}
                  <div className="flex min-w-0 flex-col justify-between gap-3 px-3 py-3 sm:px-4">
                    <div className="space-y-1">
                      <p className="line-clamp-2 text-sm font-semibold leading-tight text-slate-50">
                        {char.name}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={
                        char.role.toLowerCase().includes("main")
                          ? "w-fit border-primary/40 bg-primary/15 text-[11px] text-primary"
                          : "w-fit border-white/10 bg-white/8 text-[11px] text-slate-300"
                      }
                    >
                      {char.role}
                    </Badge>
                  </div>

                  {/* Voice Actor Info (Hidden for Manga) */}
                  {!isManga && (
                    <>
                      <div className="flex min-w-0 flex-col justify-between gap-3 border-l border-white/10 px-3 py-3 text-right sm:px-4">
                        <div className="space-y-1">
                          <p className="line-clamp-2 text-sm font-medium leading-tight text-slate-100">
                            {primaryVoiceActor?.name || "Voice actor unavailable"}
                          </p>
                        </div>
                        <p className="text-[11px] uppercase tracking-[0.18em] text-sky-200/80">
                          {primaryVoiceActor?.language || "Unknown"}
                        </p>
                      </div>

                      {/* Voice Actor Image */}
                      <div className="relative w-20 shrink-0 overflow-hidden border-l border-border/60 sm:w-24">
                        <Image
                          src={primaryVoiceActor?.image || "/images/avatar.jpg"}
                          alt={primaryVoiceActor?.name || "Voice actor unavailable"}
                          fill
                          sizes="(max-width: 640px) 80px, 96px"
                          className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {hasMoreCharacters ? (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setVisibleCount((currentCount) => currentCount + INITIAL_VISIBLE_CHARACTERS)}
            className="rounded-full border-border/70 bg-card/70 px-6"
          >
            Load more characters
          </Button>
        </div>
      ) : null}
    </section>
  )
}
