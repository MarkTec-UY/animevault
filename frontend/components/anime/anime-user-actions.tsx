"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { BookmarkCheck, Heart, Loader2, Play, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useUser } from "@/lib/hooks/use-user"
import {
  type UserAnimeStatus,
  type UserAnimeEntry,
  getUserAnimeEntry,
  updateAnimeEntry,
  toggleFavorite,
  getUserAnimeFavoriteStatus,
} from "@/lib/api/anime-library"
import type { AnimeData } from "@/lib/types/anime"
import { LibraryEditModal } from "@/components/user/library-edit-modal"
import type { LibraryItem, LibraryStatus } from "@/lib/types/profile"

interface AnimeUserActionsProps {
  anime: AnimeData
}

const STATUS_OPTIONS: { value: UserAnimeStatus; label: string }[] = [
  { value: "planning", label: "Plan to Watch" },
  { value: "watching", label: "Watching" },
  { value: "paused", label: "On Hold" },
  { value: "dropped", label: "Dropped" },
  { value: "completed", label: "Completed" },
]

export function AnimeUserActions({ anime }: AnimeUserActionsProps) {
  const router = useRouter()
  const { user, loading: authLoading } = useUser()
  const [entry, setEntry] = useState<UserAnimeEntry | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (authLoading) return

    // If not authenticated, mark as loaded and return
    if (!user) {
      const timer = setTimeout(() => {
        setLoading(false)
      }, 0)
      return () => clearTimeout(timer)
    }

    // Fetch both entry and favorite status in parallel
    const fetchData = async () => {
      try {
        const [entryData, favStatus] = await Promise.all([
          getUserAnimeEntry(anime.id),
          getUserAnimeFavoriteStatus(anime.id),
        ])
        setEntry(entryData)
        setIsFavorite(favStatus)
      } catch (error) {
        console.error("Failed to load anime entry:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [anime.id, user, authLoading])

  async function handleToggleFavorite() {
    if (!user) return
    setSaving(true)
    try {
      const currentFavorite = isFavorite
      await toggleFavorite(anime.id, currentFavorite)
      // Update only isFavorite state
      setIsFavorite(!currentFavorite)
    } catch (error) {
      console.error("Failed to toggle favorite:", error)
    } finally {
      setSaving(false)
    }
  }

  if (loading || authLoading) {
    return (
      <div className="flex flex-wrap gap-3 pt-1">
        {/* Watch Now Button Skeleton */}
        <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-muted animate-pulse">
          <Skeleton className="w-4 h-4 rounded" />
          <Skeleton className="w-12 h-4" />
        </div>

        {/* Add to List Button Skeleton */}
        <div className="flex items-center gap-2 px-6 py-2 rounded-xl border border-border bg-muted/50 animate-pulse">
          <Skeleton className="w-4 h-4 rounded" />
          <Skeleton className="w-10 h-4" />
        </div>

        {/* Favorite Button Skeleton */}
        <div className="flex items-center gap-2 px-6 py-2 rounded-xl bg-muted animate-pulse">
          <Skeleton className="w-4 h-4 rounded" />
          <Skeleton className="w-10 h-4" />
        </div>

        {/* Share Button Skeleton */}
        <div className="flex items-center gap-2 px-6 py-2 rounded-xl bg-muted animate-pulse">
          <Skeleton className="w-4 h-4 rounded" />
          <Skeleton className="w-10 h-4" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-wrap gap-3 pt-1">
        <Button
          size="lg"
          className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 rounded-xl"
          asChild
        >
          <a href="/login">
            <Play className="w-4 h-4 fill-current" />
            Sign in to track
          </a>
        </Button>
      </div>
    )
  }

  const isInLibrary = entry !== null

  const libraryItem = buildLibraryItem(entry, anime)

  function buildLibraryItem(e: typeof entry, a: AnimeData): LibraryItem {
    if (e) {
      return {
        id: e.id,
        user_id: 0,
        anime_id: a.id,
        status: (e.status as LibraryStatus),
        progress_episodes: e.progress_episodes ?? 0,
        score: e.score,
        started_at: null,
        completed_at: null,
        anime: {
          id: a.id,
          title: a.title,
          cover_image_large: a.poster,
          banner_image: a.banner,
          average_score: a.score,
          popularity: a.popularity,
          favourites: null,
          episodes: a.episodes,
        },
      }
    }
    return {
      id: 0,
      user_id: 0,
      anime_id: a.id,
      status: "planning" as const,
      progress_episodes: 0,
      score: null,
      started_at: null,
      completed_at: null,
      anime: {
        id: a.id,
        title: a.title,
        cover_image_large: a.poster,
        banner_image: a.banner,
        average_score: a.score,
        popularity: a.popularity,
        favourites: null,
        episodes: a.episodes,
      },
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-3 pt-1">
        <Button
          size="lg"
          className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 rounded-xl"
          asChild
        >
          <a href="#">
            <Play className="w-4 h-4 fill-current" />
            Watch Now
          </a>
        </Button>

        <Button
          size="lg"
          variant="outline"
          className={cn(
            "border-border gap-2 rounded-xl",
            isInLibrary
              ? "bg-primary/10 border-primary/40 text-primary"
              : "text-foreground hover:bg-secondary"
          )}
          onClick={async () => {
            if (!isInLibrary && user) {
              setSaving(true)
              try {
                const newEntry = await updateAnimeEntry(anime.id, {
                  status: "planning",
                  progress_episodes: 0,
                })
                // If already favorited, preserve that state
                setEntry({
                  ...newEntry,
                  is_favorite: isFavorite,
                })
              } catch (error) {
                console.error("Failed to add to list:", error)
                setSaving(false)
                return
              }
              setSaving(false)
            }
            setShowModal(true)
          }}
          disabled={saving}
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isInLibrary ? (
            <>
              <BookmarkCheck className="w-4 h-4" />
              <span className="hidden sm:inline">
                {STATUS_OPTIONS.find((s) => s.value === entry?.status)?.label ??
                  "In List"}
              </span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add to List</span>
            </>
          )}
        </Button>

        <Button
          size="lg"
          variant="ghost"
          className={cn(
            "gap-2 rounded-xl",
            isFavorite
              ? "text-rose-500 hover:text-rose-400"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={handleToggleFavorite}
          disabled={saving}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
          )}
          <span className="hidden sm:inline">
            {isFavorite ? "Favorited" : "Favorite"}
          </span>
        </Button>

        <Button
          size="lg"
          variant="ghost"
          className="gap-2 rounded-xl text-muted-foreground hover:text-foreground"
          aria-label="Share"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          <span className="hidden sm:inline">Share</span>
        </Button>
      </div>

      {showModal && (
        <LibraryEditModal
          item={libraryItem}
          onClose={() => setShowModal(false)}
          onUpdate={() => {
            router.refresh()
            getUserAnimeEntry(anime.id).then((data) => {
              setEntry(data)
            })
            setShowModal(false)
          }}
        />
      )}
    </>
  )
}
