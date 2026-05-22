"use client"

import Link from "next/link"
import { Star, BookOpen, Calendar, Layers } from "lucide-react"

import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { MangaData } from "@/lib/types/manga"
import { getMangaUrl } from "@/lib/utils/manga-urls"

interface MangaCardProps {
  manga: MangaData
  className?: string
  showHoverCard?: boolean
}

/**
 * Manga card component with hover card showing detailed info
 */
export function MangaCard({ manga, className = "", showHoverCard = true }: MangaCardProps) {
  const getStatusColor = (status?: string) => {
    if (!status) return "bg-muted text-muted-foreground"
    switch (status.toLowerCase()) {
      case "releasing":
      case "publishing":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
      case "finished":
      case "completed":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30"
      case "not_yet_released":
      case "upcoming":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30"
      case "hiatus":
        return "bg-orange-500/10 text-orange-400 border-orange-500/30"
      case "cancelled":
        return "bg-red-500/10 text-red-400 border-red-500/30"
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

  const cleanSynopsis = (synopsis?: string) => {
    if (!synopsis) return null
    const cleaned = synopsis.replace(/<[^>]*>/g, '')
    return cleaned.length > 150 ? cleaned.slice(0, 150).trim() + '...' : cleaned
  }

  const cardContent = (
    <Link href={getMangaUrl(manga)} className={className}>
      <div className="group">
        <div className="relative aspect-[2/3] overflow-hidden rounded-lg">
          <img
            src={manga.poster}
            alt={manga.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
          {manga.is_adult && (
            <div className="absolute top-2 left-2 rounded-full bg-red-500/90 px-2 py-0.5 text-[10px] font-bold text-white">
              18+
            </div>
          )}
        </div>
        <h3 className="mt-2 font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
          {manga.title}
        </h3>
        {manga.score > 0 && (
          <p className="text-xs text-muted-foreground">{manga.score.toFixed(1)} / 10</p>
        )}
      </div>
    </Link>
  )

  if (!showHoverCard) {
    return cardContent
  }

  return (
    <HoverCard openDelay={400} closeDelay={100}>
      <HoverCardTrigger asChild>
        {cardContent}
      </HoverCardTrigger>
      <HoverCardContent 
        side="right"
        align="start"
        className="w-80 p-0 border-border/60 bg-card/95 backdrop-blur-xl shadow-2xl z-50"
      >
        {/* Header with poster and basic info */}
        <div className="flex gap-3 p-4">
          {/* Mini Poster */}
          <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-lg bg-secondary">
            {manga.poster && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={manga.poster}
                alt={manga.title}
                className="h-full w-full object-cover"
              />
            )}
          </div>
          
          {/* Info */}
          <div className="flex flex-1 flex-col">
            <h4 className="font-semibold text-foreground leading-tight line-clamp-2">
              {manga.title}
            </h4>
            
            {/* Score */}
            <div className="mt-2 flex items-center gap-3">
              {manga.score > 0 && (
                <div className="flex items-center gap-1">
                  <Star className={cn("h-3.5 w-3.5 fill-current", getScoreColor(manga.score))} />
                  <span className={cn("text-sm font-bold", getScoreColor(manga.score))}>
                    {manga.score.toFixed(1)}
                  </span>
                </div>
              )}
              {manga.status && (
                <Badge variant="outline" className={cn("text-[10px] font-medium px-1.5 py-0", getStatusColor(manga.status))}>
                  {formatStatus(manga.status)}
                </Badge>
              )}
            </div>

            {/* Quick Stats Row */}
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {manga.type && (
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3 text-primary" />
                  {manga.type}
                </span>
              )}
              {manga.chapters > 0 && (
                <span className="flex items-center gap-1">
                  <Layers className="h-3 w-3 text-primary" />
                  {manga.chapters} ch
                </span>
              )}
              {manga.year > 0 && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-primary" />
                  {manga.year}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Volumes/Chapters */}
        {(manga.volumes > 0 || manga.chapters > 0) && (
          <div className="border-t border-border/50 px-4 py-2">
            <div className="flex items-center gap-4 text-xs">
              {manga.chapters > 0 && (
                <span className="text-muted-foreground">
                  <span className="font-medium text-foreground">{manga.chapters}</span> chapters
                </span>
              )}
              {manga.volumes > 0 && (
                <span className="text-muted-foreground">
                  <span className="font-medium text-foreground">{manga.volumes}</span> volumes
                </span>
              )}
            </div>
          </div>
        )}

        {/* Genres */}
        {manga.genres && manga.genres.length > 0 && (
          <div className="border-t border-border/50 px-4 py-2">
            <div className="flex flex-wrap gap-1">
              {manga.genres.slice(0, 4).map((genre) => (
                <Badge 
                  key={genre} 
                  variant="secondary" 
                  className="text-[10px] px-1.5 py-0 bg-secondary/80"
                >
                  {genre}
                </Badge>
              ))}
              {manga.genres.length > 4 && (
                <span className="text-[10px] text-muted-foreground px-1">
                  +{manga.genres.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Synopsis */}
        {manga.synopsis && (
          <div className="border-t border-border/50 px-4 py-3">
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
              {cleanSynopsis(manga.synopsis)}
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

interface MangaListProps {
  mangas: MangaData[]
  className?: string
}

/**
 * Grid of manga cards
 */
export function MangaList({ mangas, className = "" }: MangaListProps) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 ${className}`}>
      {mangas.map((manga) => (
        <MangaCard key={manga.id} manga={manga} />
      ))}
    </div>
  )
}
