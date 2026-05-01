import Link from "next/link"
import { Heart, Star } from "lucide-react"

import type { FavoriteItem } from "@/lib/types/profile"

interface ProfileFavoritesProps {
  favorites: FavoriteItem[]
}

export function ProfileFavorites({ favorites }: ProfileFavoritesProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Heart className="h-5 w-5 text-accent" />
        <h2 className="font-serif text-2xl text-foreground">Favorites</h2>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-muted-foreground">
          {favorites.length}
        </span>
      </div>

      {favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 px-6 py-12 text-center">
          <Heart className="mb-2 h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No favorites yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {favorites.map((fav) => (
            <Link
              key={fav.id}
              href={`/anime/${fav.anime.id}`}
              className="group relative overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-accent/40"
              title={fav.anime.title}
            >
              <div className="relative aspect-[2/3] overflow-hidden bg-secondary">
                {fav.anime.cover_image_large ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={fav.anime.cover_image_large}
                    alt={fav.anime.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                    No image
                  </div>
                )}
                {fav.anime.average_score != null && (
                  <div className="absolute bottom-1.5 right-1.5 inline-flex items-center gap-1 rounded-full bg-background/90 px-1.5 py-0.5 text-[10px] font-semibold text-foreground backdrop-blur">
                    <Star className="h-2.5 w-2.5 fill-accent text-accent" />
                    {fav.anime.average_score}
                  </div>
                )}
              </div>
              <p className="line-clamp-2 px-2 py-1.5 text-xs text-foreground group-hover:text-accent">
                {fav.anime.title}
              </p>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
