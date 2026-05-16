"use client"

import { useAiringCountdown } from "@/hooks/use-airing-countdown"

interface AiringBadgeProps {
  nextAiringAt: string
  nextAiringEpisode: number
}

export function AiringBadge({ nextAiringAt, nextAiringEpisode }: AiringBadgeProps) {
  const timeLeft = useAiringCountdown(nextAiringAt)

  if (!timeLeft) return null

  return (
    <div className="absolute bottom-2 left-2 bg-background/90 backdrop-blur text-foreground text-xs font-medium px-2 py-1 rounded-full shadow-lg">
      Ep {nextAiringEpisode}: {timeLeft}
    </div>
  )
}
