import Image from "next/image"
import Link from "next/link"
import { Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getAnimeUrlFromIdAndTitle } from "@/lib/utils/anime-urls"
import { getMangaUrlFromIdAndTitle } from "@/lib/utils/manga-urls"
import type { RelatedAnime } from "@/lib/types/anime"

interface AnimeRelatedProps {
  related: RelatedAnime[]
}

export function AnimeRelated({ related }: AnimeRelatedProps) {
  if (related.length === 0) {
    return (
      <section className="space-y-4">
        <h2 className="font-serif text-2xl text-foreground">Related Media</h2>
        <div className="rounded-2xl border border-dashed border-border/70 bg-card/40 px-6 py-12 text-center text-sm text-muted-foreground">
          Related media information is not available yet for this title.
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <h2 className="font-serif text-2xl text-foreground">Related Media</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {related.map((item) => (
          <Link
            key={item.id}
            href={
              item.mediaType === "MANGA"
                ? getMangaUrlFromIdAndTitle(item.id, item.title)
                : getAnimeUrlFromIdAndTitle(item.id, item.title)
            }
            className="group block"
          >
            <div className="relative aspect-[2/3] rounded-xl overflow-hidden border border-border group-hover:border-primary/40 transition-all duration-300">
              <Image
                src={item.poster}
                alt={item.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />

              {/* Relation badge */}
              <div className="absolute top-2 left-2">
                <Badge
                  variant="secondary"
                  className="text-[10px] bg-black/70 text-white border border-white/30 px-2 py-1 font-semibold shadow-lg shadow-black/50 backdrop-blur-sm"
                >
                  {item.relation}
                </Badge>
              </div>

              {/* Score */}
              {item.score !== null ? (
                <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-black/60 rounded-full px-2 py-0.5">
                  <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                  <span className="text-[11px] text-white font-medium">{item.score}</span>
                </div>
              ) : null}

              {/* Title + type */}
              <div className="absolute bottom-0 left-0 right-0 p-3 space-y-0.5">
                <p className="text-xs font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                  {item.title}
                </p>
                <p className="text-[10px] text-muted-foreground">{item.type}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
