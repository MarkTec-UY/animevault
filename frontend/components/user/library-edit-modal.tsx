"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { 
  X, 
  Star, 
  Check, 
  Clock, 
  Pause, 
  Trash2, 
  BookmarkPlus,
  Play,
  Minus,
  Plus
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import type { LibraryItem, LibraryStatus } from "@/lib/types/profile"
import { updateAnimeEntry } from "@/lib/api/anime-library"

const STATUS_OPTIONS: { value: LibraryStatus; label: string; icon: React.ElementType; color: string }[] = [
  { value: "watching", label: "Watching", icon: Play, color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30 hover:bg-emerald-400/20" },
  { value: "completed", label: "Completed", icon: Check, color: "text-blue-400 bg-blue-400/10 border-blue-400/30 hover:bg-blue-400/20" },
  { value: "planning", label: "Plan to Watch", icon: BookmarkPlus, color: "text-amber-400 bg-amber-400/10 border-amber-400/30 hover:bg-amber-400/20" },
  { value: "paused", label: "On Hold", icon: Pause, color: "text-orange-400 bg-orange-400/10 border-orange-400/30 hover:bg-orange-400/20" },
  { value: "dropped", label: "Dropped", icon: Trash2, color: "text-red-400 bg-red-400/10 border-red-400/30 hover:bg-red-400/20" },
]

interface LibraryEditModalProps {
  item: LibraryItem
  onClose: () => void
  onUpdate: () => void
}

export function LibraryEditModal({ item, onClose, onUpdate }: LibraryEditModalProps) {
  const [status, setStatus] = useState<LibraryStatus>(item.status)
  const [progress, setProgress] = useState(item.progress_episodes ?? 0)
  const [score, setScore] = useState(item.score ?? 0)
  const [saving, setSaving] = useState(false)

  const maxEpisodes = item.anime.episodes ?? 0

  async function handleSave() {
    setSaving(true)
    try {
      let finalProgress = progress
      if (status === "completed" && maxEpisodes) {
        finalProgress = maxEpisodes
      }
      
      await updateAnimeEntry(item.anime_id, {
        status,
        progress_episodes: finalProgress,
        score: score === 0 ? null : score,
      })
      
      onUpdate()
    } catch (error) {
      console.error("Failed to update:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = (newStatus: LibraryStatus) => {
    setStatus(newStatus)
    if (newStatus === "completed" && maxEpisodes) {
      setProgress(maxEpisodes)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />
        
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-card border border-border shadow-2xl"
        >
          {/* Header with Banner */}
          <div className="relative h-32 overflow-hidden">
            {item.anime.banner_image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.anime.banner_image}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : item.anime.cover_image_large ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.anime.cover_image_large}
                alt=""
                className="h-full w-full object-cover blur-xl scale-110"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-primary/20 to-accent/20" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
            
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white/80 backdrop-blur-sm transition-colors hover:bg-black/70 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <div className="relative -mt-16 px-6 pb-6">
            {/* Anime Info */}
            <div className="flex gap-4">
              <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-xl border-2 border-card shadow-xl">
                {item.anime.cover_image_large ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.anime.cover_image_large}
                    alt={item.anime.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-secondary" />
                )}
              </div>
              <div className="flex-1 pt-8">
                <h2 className="text-lg font-bold text-foreground line-clamp-2">
                  {item.anime.title}
                </h2>
                {maxEpisodes > 0 && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {maxEpisodes} episodes
                  </p>
                )}
              </div>
            </div>

            {/* Status Selection */}
            <div className="mt-6 space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {STATUS_OPTIONS.map((option) => {
                  const Icon = option.icon
                  const isActive = status === option.value
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleStatusChange(option.value)}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all",
                        isActive 
                          ? option.color
                          : "border-border bg-secondary/50 text-muted-foreground hover:bg-secondary"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="truncate">{option.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Episode Progress */}
            {maxEpisodes > 0 && (
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Episode Progress
                  </label>
                  <span className="text-sm font-bold text-primary">
                    {progress} / {maxEpisodes}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setProgress(Math.max(0, progress - 1))}
                    disabled={progress <= 0}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-secondary/50 text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-40"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <Slider
                    value={[progress]}
                    onValueChange={([v]) => setProgress(v)}
                    max={maxEpisodes}
                    step={1}
                    className="flex-1"
                  />
                  <button
                    onClick={() => setProgress(Math.min(maxEpisodes, progress + 1))}
                    disabled={progress >= maxEpisodes}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-secondary/50 text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-40"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Score */}
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Your Score
                </label>
                <span className="flex items-center gap-1.5 text-sm font-bold">
                  <Star className={cn("h-4 w-4", score > 0 ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />
                  {score > 0 ? score : "-"}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                  <button
                    key={value}
                    onClick={() => setScore(value)}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold transition-all",
                      score === value
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                        : "border border-border bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    {value === 0 ? "-" : value}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {score === 0 && "No score set"}
                {score >= 1 && score <= 3 && "Bad"}
                {score >= 4 && score <= 5 && "Below Average"}
                {score >= 6 && score <= 7 && "Good"}
                {score >= 8 && score <= 9 && "Great"}
                {score === 10 && "Masterpiece"}
              </p>
            </div>

            {/* Actions */}
            <div className="mt-8 flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl border-border"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  >
                    <Clock className="h-4 w-4" />
                  </motion.div>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
