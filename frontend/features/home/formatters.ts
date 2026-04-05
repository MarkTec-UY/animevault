export function formatCompactNumber(value: number | null): string | null {
  if (value === null) {
    return null
  }

  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(value)
}

export function formatScore(score: number | null): string {
  return score === null ? "N/A" : score.toFixed(1)
}

export function formatEpisodes(episodes: number | null): string {
  if (episodes === null) {
    return "TBA episodes"
  }

  return episodes === 1 ? "1 episode" : `${episodes} episodes`
}
