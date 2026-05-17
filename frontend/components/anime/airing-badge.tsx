"use client"

import * as React from "react"

interface AiringBadgeProps {
  nextAiringAt: string
  nextAiringEpisode: number
  nextAiringCountdown?: number | null
}

function formatCountdown(seconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(seconds))
  const days = Math.floor(totalSeconds / (60 * 60 * 24))
  const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60))
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60)
  const secs = totalSeconds % 60

  const paddedHours = String(hours).padStart(2, "0")
  const paddedMinutes = String(minutes).padStart(2, "0")
  const paddedSeconds = String(secs).padStart(2, "0")

  if (days > 0) {
    return `${days}d ${paddedHours}:${paddedMinutes}:${paddedSeconds}`
  }

  return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`
}

export function AiringBadge({ nextAiringAt, nextAiringEpisode, nextAiringCountdown }: AiringBadgeProps) {
  const [countdown, setCountdown] = React.useState<number | null>(
    nextAiringCountdown ?? null
  )

  React.useEffect(() => {
    if (!nextAiringAt) return

    const updateCountdown = () => {
      const target = new Date(nextAiringAt).getTime()
      const diff = target - Date.now()
      setCountdown(diff > 0 ? Math.floor(diff / 1000) : null)
    }

    updateCountdown()
    const intervalId = setInterval(updateCountdown, 1000)

    return () => clearInterval(intervalId)
  }, [nextAiringAt])

  if (!countdown) return null

  return (
    <div className="absolute bottom-2 left-2 rounded-xl border border-border/60 bg-background/90 px-3 py-2 text-foreground shadow-lg backdrop-blur">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
        Proximo episodio
      </p>
      <p className="text-sm font-semibold leading-tight">
        Episodio {nextAiringEpisode}
      </p>
      <p className="text-xs text-muted-foreground">
        Se estrena en <span className="font-mono font-semibold text-foreground">{formatCountdown(countdown)}</span>
      </p>
    </div>
  )
}
