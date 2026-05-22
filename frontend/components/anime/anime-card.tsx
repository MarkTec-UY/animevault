"use client"

import Link from "next/link"
import { AiringBadge } from "@/components/anime/airing-badge"
import { AnimeHoverCard } from "@/components/anime/anime-hover-card"
import type { AnimeData } from "@/lib/types/anime"
import { getAnimeUrl } from "@/lib/utils/anime-urls"

interface AnimeCardProps {
  anime: AnimeData
  className?: string
  showHoverCard?: boolean
}

/**
 * Anime card component with hover card showing detailed info
 */
export function AnimeCard({ anime, className = "", showHoverCard = true }: AnimeCardProps) {

  const cardContent = (
    <Link href={getAnimeUrl(anime)} className={className}>
      <div className="group">
        <div className="relative aspect-[2/3] overflow-hidden rounded-lg">
          <img
            src={anime.poster}
            alt={anime.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
          {anime.nextAiringAt && anime.nextAiringEpisode && (
            <AiringBadge
              nextAiringAt={anime.nextAiringAt}
              nextAiringEpisode={anime.nextAiringEpisode}
            />
          )}
        </div>
        <h3 className="mt-2 font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
          {anime.title}
        </h3>
        {anime.score > 0 && (
          <p className="text-xs text-muted-foreground">{anime.score.toFixed(1)} / 10</p>
        )}
      </div>
    </Link>
  )

  if (!showHoverCard) {
    return cardContent
  }

  return (
    <AnimeHoverCard anime={anime}>
      {cardContent}
    </AnimeHoverCard>
  )
}

interface AnimeListProps {
  animes: AnimeData[]
  className?: string
}

/**
 * Grid of anime cards
 */
export function AnimeList({ animes, className = "" }: AnimeListProps) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 ${className}`}>
      {animes.map((anime) => (
        <AnimeCard key={anime.id} anime={anime} />
      ))}
    </div>
  )
}
