"use client"

import { Star, Calendar, Tv, Play, Clock, Building2 } from "lucide-react"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { AnimeData } from "@/lib/types/anime"

interface AnimeHoverCardProps {
  anime: Pick<AnimeData, 'id' | 'title' | 'poster' | 'score' | 'episodes' | 'type' | 'status' | 'studio' | 'genres' | 'season' | 'year' | 'synopsis'>
  children: React.ReactNode
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
}

export function AnimeHoverCard({ anime, children, side = "right", align = "start" }: AnimeHoverCardProps) {
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "releasing":
      case "airing":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
      case "finished":
      case "completed":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30"
      case "not_yet_released":
      case "upcoming":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30"
      case "cancelled":
        return "bg-red-500/10 text-red-400 border-red-500/30"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-emerald-400"
    if (score >= 6) return "text-yellow-400"
    if (score >= 4) return "text-orange-400"
    return "text-red-400"
  }

  // Format status text
  const formatStatus = (status: string) => {
    return status?.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase()) || "Unknown"
  }

  // Clean synopsis
  const cleanSynopsis = (synopsis: string | undefined) => {
    if (!synopsis) return null
    // Remove HTML tags
    const cleaned = synopsis.replace(/<[^>]*>/g, '')
    // Truncate to ~200 chars
    if (cleaned.length > 200) {
      return cleaned.slice(0, 200).trim() + '...'
    }
    return cleaned
  }

  return (
    <HoverCard openDelay={10} closeDelay={10}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent 
        side={side} 
        align={align}
        className="w-80 p-0 border-border/60 bg-card/95 backdrop-blur-xl shadow-2xl"
      >
        {/* Header with poster and basic info */}
        <div className="flex gap-3 p-4">
          {/* Mini Poster */}
          <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-lg bg-secondary">
            {anime.poster && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={anime.poster}
                alt={anime.title}
                className="h-full w-full object-cover"
              />
            )}
          </div>
          
          {/* Info */}
          <div className="flex flex-1 flex-col">
            <h4 className="font-semibold text-foreground leading-tight line-clamp-2">
              {anime.title}
            </h4>
            
            {/* Score */}
            <div className="mt-2 flex items-center gap-3">
              {anime.score > 0 && (
                <div className="flex items-center gap-1">
                  <Star className={cn("h-3.5 w-3.5 fill-current", getScoreColor(anime.score))} />
                  <span className={cn("text-sm font-bold", getScoreColor(anime.score))}>
                    {anime.score.toFixed(1)}
                  </span>
                </div>
              )}
              {anime.status && (
                <Badge variant="outline" className={cn("text-[10px] font-medium px-1.5 py-0", getStatusColor(anime.status))}>
                  {formatStatus(anime.status)}
                </Badge>
              )}
            </div>

            {/* Quick Stats Row */}
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {anime.type && (
                <span className="flex items-center gap-1">
                  <Tv className="h-3 w-3 text-primary" />
                  {anime.type}
                </span>
              )}
              {anime.episodes > 0 && (
                <span className="flex items-center gap-1">
                  <Play className="h-3 w-3 text-primary" />
                  {anime.episodes} eps
                </span>
              )}
              {anime.season && anime.year && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-primary" />
                  {anime.season} {anime.year}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Studio */}
        {anime.studio && (
          <div className="border-t border-border/50 px-4 py-2">
            <div className="flex items-center gap-2 text-xs">
              <Building2 className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Studio:</span>
              <span className="font-medium text-foreground">{anime.studio}</span>
            </div>
          </div>
        )}

        {/* Genres */}
        {anime.genres && anime.genres.length > 0 && (
          <div className="border-t border-border/50 px-4 py-2">
            <div className="flex flex-wrap gap-1">
              {anime.genres.slice(0, 4).map((genre) => (
                <Badge 
                  key={genre} 
                  variant="secondary" 
                  className="text-[10px] px-1.5 py-0 bg-secondary/80"
                >
                  {genre}
                </Badge>
              ))}
              {anime.genres.length > 4 && (
                <span className="text-[10px] text-muted-foreground px-1">
                  +{anime.genres.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Synopsis */}
        {anime.synopsis && (
          <div className="border-t border-border/50 px-4 py-3">
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4">
              {cleanSynopsis(anime.synopsis)}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-border/50 bg-secondary/30 px-4 py-2">
          <p className="text-[10px] text-muted-foreground text-center">
            Click for more details
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

// Also create a simpler version for search results / list items with minimal data
interface SimpleAnimeHoverCardProps {
  anime: {
    id: number
    title: string
    poster?: string
    score?: number
    episodes?: number | null
    type?: string
    status?: string
    studio?: string
    genres?: string[]
    season?: string
    year?: number
  }
  children: React.ReactNode
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
}

export function SimpleAnimeHoverCard({ anime, children, side = "right", align = "start" }: SimpleAnimeHoverCardProps) {
  const getStatusColor = (status?: string) => {
    if (!status) return "bg-muted text-muted-foreground"
    switch (status.toLowerCase()) {
      case "releasing":
      case "airing":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
      case "finished":
      case "completed":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30"
      case "not_yet_released":
      case "upcoming":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getScoreColor = (score?: number) => {
    if (!score) return "text-muted-foreground"
    if (score >= 8) return "text-emerald-400"
    if (score >= 6) return "text-yellow-400"
    if (score >= 4) return "text-orange-400"
    return "text-red-400"
  }

  const formatStatus = (status?: string) => {
    if (!status) return "Unknown"
    return status.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase())
  }

  return (
    <HoverCard openDelay={1} closeDelay={100}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent 
        side={side} 
        align={align}
        className="w-72 p-0 border-border/60 bg-card/95 backdrop-blur-xl shadow-2xl"
      >
        <div className="flex gap-3 p-3">
          {/* Mini Poster */}
          <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-secondary">
            {anime.poster && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={anime.poster}
                alt={anime.title}
                className="h-full w-full object-cover"
              />
            )}
          </div>
          
          <div className="flex flex-1 flex-col gap-2">
            <h4 className="font-semibold text-sm text-foreground leading-tight line-clamp-2">
              {anime.title}
            </h4>
            
            {/* Score and Status */}
            <div className="flex items-center gap-2">
              {anime.score && anime.score > 0 && (
                <div className="flex items-center gap-1">
                  <Star className={cn("h-3 w-3 fill-current", getScoreColor(anime.score))} />
                  <span className={cn("text-xs font-bold", getScoreColor(anime.score))}>
                    {anime.score.toFixed(1)}
                  </span>
                </div>
              )}
              {anime.status && (
                <Badge variant="outline" className={cn("text-[9px] font-medium px-1 py-0", getStatusColor(anime.status))}>
                  {formatStatus(anime.status)}
                </Badge>
              )}
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
              {anime.type && <span>{anime.type}</span>}
              {anime.episodes && <span>{anime.episodes} eps</span>}
              {anime.season && anime.year && <span>{anime.season} {anime.year}</span>}
            </div>

            {/* Genres */}
            {anime.genres && anime.genres.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {anime.genres.slice(0, 3).map((genre) => (
                  <Badge 
                    key={genre} 
                    variant="secondary" 
                    className="text-[9px] px-1 py-0 bg-secondary/80"
                  >
                    {genre}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
