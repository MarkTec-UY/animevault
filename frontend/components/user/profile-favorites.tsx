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
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/10">
          <Heart className="h-5 w-5 text-pink-500" />
        </div>
        <div>
          <h2 className="font-serif text-2xl font-bold text-foreground">Favorites</h2>
          <p className="text-sm text-muted-foreground">
            {favorites.length} {favorites.length === 1 ? 'anime' : 'anime'} in your favorites
          </p>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/50 bg-card/30 px-6 py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-pink-500/10">
            <Sparkles className="h-8 w-8 text-pink-500" />
          </div>
          <p className="text-lg font-medium text-foreground">No favorites yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Start adding anime to your favorites to see them here
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
          {favorites.map((fav) => (
            <Link
              key={fav.id}
              href={`/anime/${fav.anime.id}`}
              className="group relative overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:border-pink-500/30 hover:shadow-lg hover:shadow-pink-500/10"
              title={fav.anime.title}
            >
              <div className="relative aspect-[2/3] overflow-hidden bg-secondary">
                {fav.anime.cover_image_large ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={fav.anime.cover_image_large}
                    alt={fav.anime.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                    No image
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                {fav.anime.average_score != null && (
                  <div className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-background/95 px-2 py-1 text-xs font-bold text-foreground shadow-lg backdrop-blur">
                    <Star className="h-3 w-3 fill-pink-500 text-pink-500" />
                    {fav.anime.average_score}
                  </div>
                )}
                <div className="absolute top-2 left-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-500/90 shadow-lg">
                    <Heart className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-2">
                <p className="line-clamp-2 text-xs font-medium text-foreground transition-colors group-hover:text-pink-400">
                  {fav.anime.title}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
