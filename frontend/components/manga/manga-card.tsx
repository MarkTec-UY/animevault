import Link from "next/link"

import type { MangaData } from "@/lib/types/manga"
import { getMangaUrl } from "@/lib/utils/manga-urls"

interface MangaCardProps {
  manga: MangaData
  className?: string
}

/**
 * Simple manga card link component
 * Routes to /manga/[id]/[title] format
 */
export function MangaCard({ manga, className = "" }: MangaCardProps) {
  return (
    <Link href={getMangaUrl(manga)} className={className}>
      <div className="group">
        <div className="relative aspect-[2/3] overflow-hidden rounded-lg">
          <img
            src={manga.poster}
            alt={manga.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </div>
        <h3 className="mt-2 font-semibold text-sm line-clamp-2 group-hover:text-primary">
          {manga.title}
        </h3>
        {manga.score > 0 && (
          <p className="text-xs text-muted-foreground">{manga.score.toFixed(1)} / 10</p>
        )}
      </div>
    </Link>
  )
}

interface MangaListProps {
  mangas: MangaData[]
  className?: string
}

/**
 * Grid of manga cards
 */
export function MangaList({ mangas, className = "" }: MangaListProps) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 ${className}`}>
      {mangas.map((manga) => (
        <MangaCard key={manga.id} manga={manga} />
      ))}
    </div>
  )
}
