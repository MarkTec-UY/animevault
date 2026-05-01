"use client"

import { useState } from "react"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { LibraryItem, LibraryStatus } from "@/lib/types/profile"
import { updateAnimeEntry } from "@/lib/api/anime-library"

const STATUS_OPTIONS: { value: LibraryStatus; label: string }[] = [
  { value: "planning", label: "Plan to Watch" },
  { value: "watching", label: "Watching" },
  { value: "on_hold", label: "On Hold" },
  { value: "dropped", label: "Dropped" },
  { value: "completed", label: "Completed" },
]

interface LibraryEditModalProps {
  item: LibraryItem
  onClose: () => void
  onUpdate: () => void
}

export function LibraryEditModal({ item, onClose, onUpdate }: LibraryEditModalProps) {
  const [status, setStatus] = useState<LibraryStatus>(item.status)
  const [progressInput, setProgressInput] = useState(String(item.progress_episodes ?? ""))
  const [scoreInput, setScoreInput] = useState(item.score != null ? String(item.score) : "")
  const [saving, setSaving] = useState(false)

  const maxEpisodes = item.anime.episodes ?? undefined

  async function handleSave() {
    setSaving(true)
    try {
      const progress = progressInput ? parseInt(progressInput, 10) : 0
      const scoreStr = scoreInput.trim()
      const score = scoreStr === "" ? null : parseInt(scoreStr, 10)
      
      let finalProgress = progress
      if (status === "completed" && maxEpisodes) {
        finalProgress = maxEpisodes
      }
      
      const result = await updateAnimeEntry(item.anime_id, {
        status,
        progress_episodes: finalProgress,
        score,
      })
      
      onUpdate()
    } catch (error) {
      console.error("Failed to update:", error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Edit Entry</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="flex gap-3">
            {item.anime.cover_image_large ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.anime.cover_image_large}
                alt={item.anime.title}
                className="h-20 w-14 rounded-md object-cover"
              />
            ) : (
              <div className="h-20 w-14 rounded-md bg-secondary" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">
                {item.anime.title}
              </p>
              {maxEpisodes && (
                <p className="text-sm text-muted-foreground">
                  {maxEpisodes} episodes
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Status</Label>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as LibraryStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {maxEpisodes && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Progress</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={maxEpisodes}
                  value={progressInput}
                  onChange={(e) => setProgressInput(e.target.value)}
                  className="w-24"
                />
                <span className="text-muted-foreground">/ {maxEpisodes}</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-sm font-medium">Score (0-10)</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                max={10}
                value={scoreInput}
                onChange={(e) => setScoreInput(e.target.value)}
                placeholder="-"
                className="w-24"
              />
              <span className="text-muted-foreground">/ 10</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  )
}