"use client"

import * as React from "react"

function formatAiringCountdown(dateString: string | null): string {
  if (!dateString) return ""

  const target = new Date(dateString)
  const diff = target.getTime() - Date.now()

  if (Number.isNaN(target.getTime()) || diff <= 0) {
    return ""
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }

  return `${minutes}m`
}

export function useAiringCountdown(nextAiringAt: string | null): string {
  return React.useSyncExternalStore(
    React.useCallback((onStoreChange) => {
      if (!nextAiringAt) {
        return () => undefined
      }

      const intervalId = window.setInterval(onStoreChange, 60_000)
      return () => window.clearInterval(intervalId)
    }, [nextAiringAt]),
    React.useCallback(
      () => formatAiringCountdown(nextAiringAt),
      [nextAiringAt],
    ),
    () => formatAiringCountdown(nextAiringAt),
  )
}
