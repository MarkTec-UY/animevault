"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Star, Heart } from "lucide-react"
import type { FavoriteAnime } from "@/lib/types/user"
import { cn } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"

interface FavoritesGridProps {
  favorites: FavoriteAnime[]
  loading?: boolean
}

export function FavoritesGrid({ favorites, loading }: FavoritesGridProps) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="mb-3 h-40 w-full" />
              <Skeleton className="mb-2 h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!favorites || favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <div className="mb-4 text-4xl">💖</div>
        <h3 className="mb-2 text-lg font-semibold">No favorites yet</h3>
        <p className="text-sm text-muted-foreground">
          Start adding anime to your favorites to build your collection
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {favorites.map((favorite) => (
        <Card key={favorite.id} className="overflow-hidden">
          <Link href={`/anime/${favorite.anime.id}`}>
            <div className="group relative aspect-[2/3] overflow-hidden">
              {favorite.anime.poster_image ? (
                <Image
                  src={favorite.anime.poster_image}
                  alt={favorite.anime.title}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted">
                  <span className="text-4xl">🎬</span>
                </div>
              )}
              <div className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white">
                <Heart className="h-4 w-4 fill-current" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 transition-opacity group-hover:opacity-100">
                <Button size="sm" variant="secondary" className="w-full">
                  View Details
                </Button>
              </div>
            </div>
          </Link>
          <CardContent className="p-4">
            <div className="mb-2 flex items-start justify-between gap-2">
              <Link
                href={`/anime/${favorite.anime.id}`}
                className="line-clamp-2 font-semibold hover:underline"
              >
                {favorite.anime.title}
              </Link>
              {favorite.anime.score && (
                <div className="flex items-center gap-1 text-sm font-medium text-yellow-600">
                  <Star className="h-4 w-4 fill-current" />
                  {favorite.anime.score}
                </div>
              )}
            </div>

            <div className="mb-3 flex flex-wrap gap-2">
              {favorite.anime.type && (
                <Badge variant="secondary" className="text-xs">
                  {favorite.anime.type.toUpperCase()}
                </Badge>
              )}
              {favorite.anime.status && (
                <Badge variant="outline" className="text-xs">
                  {favorite.anime.status}
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              {favorite.anime.episodes && (
                <span>{favorite.anime.episodes} eps</span>
              )}
              <span className="text-xs">
                Added {new Date(favorite.created_at).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}