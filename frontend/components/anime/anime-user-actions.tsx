"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { BookmarkCheck, Heart, Loader2, Play, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useUser } from "@/lib/hooks/use-user"
import {
  type UserAnimeStatus,
  type UserAnimeEntry,
  getUserAnimeEntry,
  updateAnimeEntry,
  toggleFavorite,
} from "@/lib/api/anime-library"
import type { AnimeData } from "@/lib/types/anime"
import { LibraryEditModal } from "@/components/user/library-edit-modal"
import type { LibraryItem } from "@/lib/types/profile"

interface AnimeUserActionsProps {
  anime: AnimeData
}

const STATUS_OPTIONS: { value: UserAnimeStatus; label: string }[] = [
  { value: "planning", label: "Plan to Watch" },
  { value: "watching", label: "Watching" },
  { value: "on_hold", label: "On Hold" },
  { value: "dropped", label: "Dropped" },
  { value: "completed", label: "Completed" },
]

export function AnimeUserActions({ anime }: AnimeUserActionsProps) {
  const router = useRouter()
  const { user, loading: authLoading } = useUser()
  const [entry, setEntry] = useState<UserAnimeEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setLoading(false)
      return
    }
    getUserAnimeEntry(anime.id).then((data) => {
      setEntry(data)
      setLoading(false)
    })
  }, [anime.id, user, authLoading])

  async function handleToggleFavorite() {
    if (!user || !entry) return
    setSaving(true)
    try {
      await toggleFavorite(anime.id, entry.is_favorite)
      setEntry({ ...entry, is_favorite: !entry.is_favorite })
    } catch (error) {
      console.error("Failed to toggle favorite:", error)
    } finally {
      setSaving(false)
    }
  }

  if (loading || authLoading) {
    return (
      <div className="flex flex-wrap gap-3 pt-1">
        <Button size="lg" disabled className="bg-primary/50">
          <Loader2 className="w-4 h-4 animate-spin" />
        </Button>
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
  const isFavorite = entry?.is_favorite ?? false

  const libraryItem = buildLibraryItem(entry, anime)

  function buildLibraryItem(e: typeof entry, a: AnimeData): LibraryItem {
    if (e) {
      return {
        id: e.id,
        user_id: 0,
        anime_id: a.id,
        status: e.status,
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
                setEntry(newEntry)
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