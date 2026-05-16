"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { BookmarkCheck, Heart, Loader2, Plus, Share2, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
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
  const [hydrated, setHydrated] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      setHydrated(true)
      return
    }

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
        setHydrated(true)
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
      setIsFavorite(!currentFavorite)
    } catch (error) {
      console.error("Failed to toggle favorite:", error)
    } finally {
      setSaving(false)
    }
  }

  const isInLibrary = entry !== null
  const statusLabel = STATUS_OPTIONS.find((s) => s.value === entry?.status)?.label ?? "In List"

  // Server-rendered default state (no skeleton). Show "Add to List" + "Favorite"
  // Once hydrated, the real user state replaces the defaults seamlessly.
  const showSignIn = hydrated && !user

  function buildLibraryItem(e: typeof entry, a: AnimeData): LibraryItem {
    if (e) {
      return {
        id: e.id,
        user_id: 0,
        anime_id: a.id,
        status: e.status as LibraryStatus,
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

  const libraryItem = buildLibraryItem(entry, anime)

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 pt-1">
        {/* Main list action -- pill-shaped */}
        {showSignIn ? (
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 rounded-full px-6 font-medium"
            asChild
          >
            <a href="/login">
              <Plus className="w-4 h-4" />
              Sign in to track
            </a>
          </Button>
        ) : (
          <Button
            size="lg"
            className={cn(
              "gap-2 rounded-full px-6 font-medium transition-all duration-200",
              isInLibrary
                ? "bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25"
                : "bg-primary hover:bg-primary/90 text-primary-foreground"
            )}
            onClick={async () => {
              if (!isInLibrary && user) {
                setSaving(true)
                try {
                  const newEntry = await updateAnimeEntry(anime.id, {
                    status: "planning",
                    progress_episodes: 0,
                  })
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
                {statusLabel}
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Add to List
              </>
            )}
          </Button>
        )}

        {/* Episode progress -- shown when in library */}
        {isInLibrary && anime.episodes > 0 && (
          <div className="flex items-center gap-2 bg-card border border-border rounded-full px-4 py-2">
            <div className="w-20 h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(
                    ((entry?.progress_episodes ?? 0) / anime.episodes) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              {entry?.progress_episodes ?? 0}/{anime.episodes}
            </span>
          </div>
        )}

        {/* Favorite button */}
        {!showSignIn && (
          <button
            onClick={handleToggleFavorite}
            disabled={saving}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full border transition-all duration-200",
              isFavorite
                ? "bg-rose-500/15 border-rose-500/30 text-rose-500 hover:bg-rose-500/25"
                : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
            )}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
            )}
          </button>
        )}

        {/* Share button */}
        <button
          aria-label="Share"
          className="flex items-center justify-center w-10 h-10 rounded-full bg-card border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all duration-200"
        >
          <Share2 className="w-4 h-4" />
        </button>
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
