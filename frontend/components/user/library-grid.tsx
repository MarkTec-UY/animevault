"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Star, Clock, Award, PlayCircle, PauseCircle } from "lucide-react"
import type { LibraryEntry } from "@/lib/types/user"
import { cn } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"

interface LibraryGridProps {
  entries: LibraryEntry[]
  loading?: boolean
}

const statusConfig = {
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

export function LibraryGrid({ entries, loading }: LibraryGridProps) {
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

  if (!entries || entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <div className="mb-4 text-4xl">📚</div>
        <h3 className="mb-2 text-lg font-semibold">No anime in library</h3>
        <p className="text-sm text-muted-foreground">
          Start adding anime to your library to track your progress
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {entries.map((entry) => {
        const status = statusConfig[entry.status] || statusConfig.plan_to_watch
        const StatusIcon = status.icon

        return (
          <Card key={entry.id} className="overflow-hidden">
            <Link href={`/anime/${entry.anime.id}`}>
              <div className="group relative aspect-[2/3] overflow-hidden">
                {entry.anime.poster_image ? (
                  <Image
                    src={entry.anime.poster_image}
                    alt={entry.anime.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted">
                    <span className="text-4xl">🎬</span>
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
                  href={`/anime/${entry.anime.id}`}
                  className="line-clamp-2 font-semibold hover:underline"
                >
                  {entry.anime.title}
                </Link>
                {entry.score > 0 && (
                  <div className="flex items-center gap-1 text-sm font-medium text-yellow-600">
                    <Star className="h-4 w-4 fill-current" />
                    {entry.score}
                  </div>
                )}
              </div>

              <div className="mb-3 flex flex-wrap gap-2">
                <Badge variant="outline" className={cn("gap-1", status.textColor)}>
                  <StatusIcon className="h-3 w-3" />
                  {status.label}
                </Badge>
                {entry.anime.type && (
                  <Badge variant="secondary" className="text-xs">
                    {entry.anime.type.toUpperCase()}
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>
                    {entry.progress_episodes}
                    {entry.anime.episodes ? ` / ${entry.anime.episodes}` : ""}
                  </span>
                </div>
                {entry.anime.score && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                    <span>{entry.anime.score}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}