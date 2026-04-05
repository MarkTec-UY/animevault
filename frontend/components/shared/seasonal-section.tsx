import Image from "next/image"
import Link from "next/link"
import { Calendar, ChevronRight, Star } from "lucide-react"

import { formatEpisodes, formatScore } from "@/features/home/formatters"
import type { HomeAnime } from "@/features/home/types"

interface SeasonalSectionProps {
  label: string
  items: HomeAnime[]
}

export function SeasonalSection({ label, items }: SeasonalSectionProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <section className="bg-card/30 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium text-accent">
              <Calendar className="h-4 w-4" />
              <span>{label}</span>
            </div>
            <h2 className="font-serif text-3xl text-foreground sm:text-4xl">This Season</h2>
          </div>
          <Link
            href="/anime"
            className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            Full schedule <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((anime, index) => (
            <Link
              key={anime.id}
              href={anime.href}
              className="group flex gap-4 rounded-xl border border-border bg-card p-3 transition-all duration-200 hover:border-accent/40 hover:bg-card/80"
            >
              <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-lg bg-secondary">
                {anime.coverImageUrl ? (
                  <Image
                    src={anime.coverImageUrl}
                    alt={anime.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="64px"
                  />
                ) : (
                  <div
                    className="h-full w-full"
                    style={{ background: anime.coverImageColor ?? "rgba(167,139,250,0.16)" }}
                  />
                )}
                {index < 2 ? (
                  <div className="absolute top-1 left-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                    HOT
                  </div>
                ) : null}
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
                <div>
                  <p className="mb-1 text-xs font-medium text-accent">#{index + 1} this season</p>
                  <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                    {anime.title}
                  </h3>
                </div>
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-semibold text-foreground">{formatScore(anime.score)}</span>
                    <span className="ml-1 text-xs text-muted-foreground">{formatEpisodes(anime.episodes)}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {anime.genres.slice(0, 2).map((genre) => (
                      <span key={genre} className="rounded bg-secondary px-1.5 py-0.5 text-xs text-muted-foreground">
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
