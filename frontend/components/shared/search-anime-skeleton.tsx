"use client"

import { Skeleton } from "@/components/ui/skeleton"

/**
 * Skeleton loading state for anime search results
 */
export function SearchAnimeSkeleton() {
  return (
    <div className="space-y-0">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0"
        >
          {/* Poster skeleton */}
          <Skeleton className="w-12 h-16 rounded shrink-0" />

          {/* Content skeleton */}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-3 w-1/3 rounded" />
          </div>

          {/* Badge skeleton */}
          <Skeleton className="h-6 w-10 rounded shrink-0" />
        </div>
      ))}
    </div>
  )
}
