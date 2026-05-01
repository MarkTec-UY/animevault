import Link from "next/link"
import { Star } from "lucide-react"

import type { LibraryItem, ProfileAnimeRef } from "@/lib/types/profile"

interface LibraryAnimeCardProps {
  item: LibraryItem
}

function progressPercent(item: LibraryItem): number {
  const total = item.anime.episodes ?? 0
  if (!total || total <= 0) return 0
  const pct = (item.progress_episodes / total) * 100
  return Math.min(100, Math.max(0, pct))
}

function CardCover({ anime }: { anime: ProfileAnimeRef }) {
  if (anime.cover_image_large) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={anime.cover_image_large}
        alt={anime.title}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
    )
  }
  return (
    <div className="flex h-full w-full items-center justify-center bg-secondary text-xs text-muted-foreground">
      No image
    </div>
  )
}

export function LibraryAnimeCard({ item }: LibraryAnimeCardProps) {
  const pct = progressPercent(item)
  const totalEpisodes = item.anime.episodes ?? null

  return (
    <Link
      href={`/anime/${item.anime.id}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/40 hover:shadow-lg"
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-secondary">
        <CardCover anime={item.anime} />
        {item.score != null && item.score > 0 && (
          <div className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-xs font-semibold text-foreground backdrop-blur">
            <Star className="h-3 w-3 fill-accent text-accent" />
            {item.score}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="line-clamp-2 text-sm font-medium text-foreground group-hover:text-primary">
          {item.anime.title}
        </h3>

        <div className="mt-auto space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {item.progress_episodes}
              {totalEpisodes ? ` / ${totalEpisodes}` : ""} ep
            </span>
            {pct > 0 && <span>{Math.round(pct)}%</span>}
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  )
}
