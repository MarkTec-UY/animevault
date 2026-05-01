"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Star, Clock, Award, PlayCircle, PauseCircle, Heart } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"

export type AnimeStatus = "watching" | "completed" | "plan_to_watch" | "dropped" | "on_hold"

export interface AnimeBasic {
  id: number
  title: string
  poster_image?: string
  cover_image?: string
  type?: { code: string; description?: string } | string
  status?: { code: string; description?: string } | string
  episodes?: number
  score?: number
}

export interface LibraryEntryData {
  anime: AnimeBasic
  status: AnimeStatus
  progress_episodes: number
  score?: number
}

export interface FavoriteEntryData {
  anime: AnimeBasic
  is_favorite: boolean
  favorited_at?: string
  created_at?: string
}

export type CardVariant = "library" | "favorites"

export interface AnimeGridCardProps {
  data: LibraryEntryData | FavoriteEntryData
  variant: CardVariant
}

const statusConfig: Record<AnimeStatus, { label: string; icon: typeof PlayCircle; color: string; textColor: string }> = {
  watching: {
    label: "Watching",
    icon: PlayCircle,
    color: "bg-blue-500",
    textColor: "text-blue-600",
  },
  completed: {
    label: "Completed",
    icon: Award,
    color: "bg-green-500",
    textColor: "text-green-600",
  },
  plan_to_watch: {
    label: "Plan to Watch",
    icon: Clock,
    color: "bg-orange-500",
    textColor: "text-orange-600",
  },
  dropped: {
    label: "Dropped",
    icon: PauseCircle,
    color: "bg-red-500",
    textColor: "text-red-600",
  },
  on_hold: {
    label: "On Hold",
    icon: Clock,
    color: "bg-yellow-500",
    textColor: "text-yellow-600",
  },
}

function isLibraryEntry(data: LibraryEntryData | FavoriteEntryData): data is LibraryEntryData {
  return "progress_episodes" in data
}

function isFavoriteEntry(data: LibraryEntryData | FavoriteEntryData): data is FavoriteEntryData {
  return "is_favorite" in data
}

export function AnimeGridCard({ data, variant }: AnimeGridCardProps) {
  const anime = data.anime
  const isLibrary = isLibraryEntry(data)
  const isFavorite = isFavoriteEntry(data)

  return (
    <Card className="overflow-hidden">
      <Link href={`/anime/${anime.id}`}>
        <div className="group relative aspect-[2/3] overflow-hidden">
          {anime.cover_image || anime.poster_image ? (
            <Image
              src={anime.cover_image || anime.poster_image || ""}
              alt={anime.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <span className="text-4xl">🎬</span>
            </div>
          )}
          {variant === "favorites" && isFavorite && (
            <div className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white">
              <Heart className="h-4 w-4 fill-current" />
            </div>
          )}
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
            href={`/anime/${anime.id}`}
            className="line-clamp-2 font-semibold hover:underline"
          >
            {anime.title}
          </Link>
          {(anime.score ?? 0) > 0 && (
            <div className="flex items-center gap-1 text-sm font-medium text-yellow-600">
              <Star className="h-4 w-4 fill-current" />
              {anime.score}
            </div>
          )}
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          {isLibrary && (
            <>
              {(() => {
                const status = statusConfig[data.status as AnimeStatus] || statusConfig.plan_to_watch
                const StatusIcon = status.icon
                return (
                  <Badge variant="outline" className={cn("gap-1", status.textColor)}>
                    <StatusIcon className="h-3 w-3" />
                    {status.label}
                  </Badge>
                )
              })()}
            </>
          )}
          {anime.type && (
            <Badge variant="secondary" className="text-xs">
              {typeof anime.type === "string" ? anime.type.toUpperCase() : anime.type?.code?.toUpperCase() ?? ""}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          {isLibrary && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>
                {data.progress_episodes}
                {anime.episodes ? ` / ${anime.episodes}` : ""}
              </span>
            </div>
          )}
          {isFavorite && anime.episodes && (
            <span>{anime.episodes} eps</span>
          )}
          {isFavorite && (
            <span className="text-xs">
              Added {new Date((data as FavoriteEntryData).created_at || data.favorited_at || "").toLocaleDateString()}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export interface AnimeGridProps {
  items: (LibraryEntryData | FavoriteEntryData)[]
  variant: CardVariant
  loading?: boolean
}

export function AnimeGrid({ items, variant, loading }: AnimeGridProps) {
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

  const emptyMessage = variant === "library"
    ? "No anime in library"
    : "No favorites yet"

  const emptyDescription = variant === "library"
    ? "Start adding anime to your library to track your progress"
    : "Start adding anime to your favorites to build your collection"

  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <div className="mb-4 text-4xl">{variant === "library" ? "📚" : "💖"}</div>
        <h3 className="mb-2 text-lg font-semibold">{emptyMessage}</h3>
        <p className="text-sm text-muted-foreground">{emptyDescription}</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => (
        <AnimeGridCard key={item.anime.id} data={item} variant={variant} />
      ))}
    </div>
  )
}