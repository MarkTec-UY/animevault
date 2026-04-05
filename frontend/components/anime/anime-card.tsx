import Link from "next/link"
import type { AnimeData } from "@/lib/types/anime"
import { getAnimeUrl } from "@/lib/utils/anime-urls"

interface AnimeCardProps {
  anime: AnimeData
  className?: string
}

/**
 * Simple anime card link component
 * Routes to /anime/[id]/[title] format
 */
export function AnimeCard({ anime, className = "" }: AnimeCardProps) {
  return (
    <Link href={getAnimeUrl(anime)} className={className}>
      <div className="group">
        <img
          src={anime.poster}
          alt={anime.title}
          className="w-full rounded-lg object-cover"
        />
        <h3 className="mt-2 font-semibold text-sm line-clamp-2 group-hover:text-primary">
          {anime.title}
        </h3>
        {anime.score > 0 && (
          <p className="text-xs text-muted-foreground">{anime.score.toFixed(1)} / 10</p>
        )}
      </div>
    </Link>
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
