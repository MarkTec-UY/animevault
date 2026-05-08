import Link from "next/link"
import { Heart, Star, Sparkles } from "lucide-react"

import type { FavoriteItem } from "@/lib/types/profile"

interface ProfileFavoritesProps {
  favorites: FavoriteItem[]
}

export function ProfileFavorites({ favorites }: ProfileFavoritesProps) {
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 shadow-lg shadow-pink-500/20">
          <Heart className="h-5 w-5 text-white fill-current" />
        </div>
        <div>
          <h2 className="font-serif text-2xl font-bold text-foreground">Favorites</h2>
          <p className="text-sm text-muted-foreground">
            {favorites.length} {favorites.length === 1 ? "anime" : "anime"} in your favorites
          </p>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/50 bg-card/30 px-6 py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500/20 to-rose-500/20">
            <Sparkles className="h-8 w-8 text-pink-500" />
          </div>
          <p className="text-lg font-medium text-foreground">No favorites yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Start adding anime to your favorites to see them here
          </p>
          <Link
            href="/anime"
            className="mt-4 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Discover anime →
          </Link>
        </div>
      ) : (
        <div className="group/slider relative">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
            {favorites.map((fav) => (
              <Link
                key={fav.id}
                href={`/anime/${fav.anime.id}/${fav.anime.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`}
                className="group/item relative shrink-0 w-28 sm:w-32"
                title={fav.anime.title}
              >
                <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-border bg-card shadow-md transition-all duration-300 group-hover/item:scale-105 group-hover/item:shadow-xl group-hover/item:shadow-pink-500/15 group-hover/item:border-pink-500/30">
                  {fav.anime.cover_image_large ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={fav.anime.cover_image_large}
                      alt={fav.anime.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover/item:scale-110"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-secondary text-xs text-muted-foreground">
                      No image
                    </div>
                  )}

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover/item:opacity-80 transition-opacity" />

                  {/* Score badge */}
                  {fav.anime.average_score != null && (
                    <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 text-xs font-bold shadow-lg backdrop-blur transition-transform group-hover/item:scale-110">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-foreground">{fav.anime.average_score}</span>
                    </div>
                  )}

                  {/* Heart icon on hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity duration-300">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pink-500/90 shadow-lg backdrop-blur">
                      <Heart className="h-6 w-6 text-white fill-current" />
                    </div>
                  </div>

                  {/* Title at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <p className="line-clamp-2 text-xs font-medium text-white text-shadow-md leading-tight">
                      {fav.anime.title}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}