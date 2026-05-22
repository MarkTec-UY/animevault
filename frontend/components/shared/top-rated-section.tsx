import Image from "next/image"
import Link from "next/link"
import { ChevronRight, Star, Trophy } from "lucide-react"

import { formatEpisodes, formatScore } from "@/features/home/formatters"
import type { HomeAnime } from "@/features/home/types"

interface TopRatedSectionProps {
  items: HomeAnime[]
}

export function TopRatedSection({ items }: TopRatedSectionProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <section className="bg-background py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div className="space-y-1">
            <div className="section-eyebrow">
              <Trophy className="h-4 w-4" />
              <span>Highest score</span>
            </div>
            <h2 className="section-title">Top Rated Anime</h2>
          </div>
          <Link
            href="/anime"
            className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            Browse all <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((anime, index) => (
            <Link
              key={anime.id}
              href={anime.href}
              className="group overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-black/10"
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
                {anime.coverImageUrl ? (
                  <Image
                    src={anime.coverImageUrl}
                    alt={anime.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, 25vw"
                  />
                ) : (
                  <div
                    className="h-full w-full"
                    style={{ background: anime.coverImageColor ?? "rgba(99,163,117,0.18)" }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute top-2 left-2 rounded-md bg-primary px-2 py-1 text-xs font-bold text-primary-foreground">
                  #{index + 1}
                </div>
                {anime.statusLabel ? (
                  <div className="absolute right-2 bottom-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {anime.statusLabel}
                  </div>
                ) : null}
              </div>

              <div className="space-y-2 p-4">
                <div>
                  <h3 className="line-clamp-1 font-semibold text-foreground transition-colors group-hover:text-primary">
                    {anime.title}
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {anime.studioName ?? anime.seasonLabel ?? "Catalog pick"}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-semibold text-foreground">{formatScore(anime.score)}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatEpisodes(anime.episodes)}</span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {anime.genres.slice(0, 2).map((genre) => (
                    <span key={genre} className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
