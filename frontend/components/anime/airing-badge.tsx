"use client"

interface AiringBadgeProps {
  nextAiringAt: string
  nextAiringEpisode: number
}

function formatAiringDate(dateString: string): string | null {
  const date = new Date(dateString)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  const dateLabel = new Intl.DateTimeFormat("es-UY", {
    day: "numeric",
    month: "short",
  }).format(date)

  const timeLabel = new Intl.DateTimeFormat("es-UY", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)

  return `Se estrena el ${dateLabel} a las ${timeLabel}`
}

export function AiringBadge({ nextAiringAt, nextAiringEpisode }: AiringBadgeProps) {
  const airingLabel = formatAiringDate(nextAiringAt)

  if (!airingLabel) return null

  return (
    <div className="absolute bottom-2 left-2 right-2 rounded-xl border border-border/60 bg-background/90 px-3 py-2 text-center text-foreground shadow-lg backdrop-blur">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
        Proximo episodio
      </p>
      <p className="text-sm font-semibold leading-tight">
        Episodio {nextAiringEpisode}
      </p>
      <p className="text-xs text-muted-foreground">
        {airingLabel}
      </p>
    </div>
  )
}
