import Image from "next/image"
import Link from "next/link"
import { ChevronRight, Star, TrendingUp } from "lucide-react"

import { formatScore } from "@/features/home/formatters"
import type { HomeAnime } from "@/features/home/types"

interface TrendingSectionProps {
  items: HomeAnime[]
}

function AnimeCard({ anime, rank }: { anime: HomeAnime; rank: number }) {
  return (
    <Link
      href={anime.href}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-black/10"
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-secondary">
        {anime.coverImageUrl ? (
          <Image
            src={anime.coverImageUrl}
            alt={anime.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        ) : (
          <div
            className="h-full w-full"
            style={{ background: anime.coverImageColor ?? "rgba(99,163,117,0.14)" }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="absolute top-2 left-2 flex h-7 w-7 items-center justify-center rounded-md bg-background/85 text-xs font-bold text-primary backdrop-blur-sm">
          #{rank}
        </div>
        {anime.statusLabel ? (
          <div className="absolute top-2 right-2 rounded-full bg-secondary/90 px-2 py-0.5 text-[11px] text-muted-foreground">
            {anime.statusLabel}
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col space-y-2 p-3">
        <div>
          <h3 className="line-clamp-1 text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
            {anime.title}
          </h3>
          {anime.nativeTitle ? (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{anime.nativeTitle}</p>
          ) : null}
        </div>

        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-semibold text-foreground">{formatScore(anime.score)}</span>
          </div>
          {anime.seasonLabel ? <span className="text-xs text-muted-foreground">{anime.seasonLabel}</span> : null}
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
  )
}

export function TrendingSection({ items }: TrendingSectionProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <section className="bg-background py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <TrendingUp className="h-4 w-4" />
              <span>Right now</span>
            </div>
            <h2 className="font-serif text-3xl text-foreground sm:text-4xl">Trending Anime</h2>
          </div>
          <Link
            href="/anime"
            className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            View all <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {items.map((anime, index) => (
            <AnimeCard key={anime.id} anime={anime} rank={index + 1} />
          ))}
        </div>
      </div>
    </section>
  )
}
