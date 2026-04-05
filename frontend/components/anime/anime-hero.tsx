"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Play, Plus, Heart, Share2, Star, ChevronLeft,
  Clock, Tv, Calendar, Globe, BookmarkCheck
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { AnimeData } from "@/lib/types/anime"

interface AnimeHeroProps {
  anime: AnimeData
}

export function AnimeHero({ anime }: AnimeHeroProps) {
  const [inList, setInList] = useState(false)
  const [liked, setLiked] = useState(false)

  return (
    <section className="relative">
      {/* Banner */}
      <div className="relative h-72 sm:h-96 overflow-hidden">
        <Image
          src={anime.banner}
          alt={`${anime.title} banner`}
          fill
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/50 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/60 to-transparent" />
      </div>

      {/* Main info — overlaps the banner */}
      <div className="relative -mt-24 sm:-mt-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-0">
        <div className="flex flex-col sm:flex-row gap-6 lg:gap-8 items-start">
          {/* Poster */}
          <div className="relative w-36 sm:w-44 lg:w-52 shrink-0 rounded-xl overflow-hidden border-2 border-border shadow-2xl shadow-black/60 self-end sm:self-auto">
            <Image
              src={anime.poster}
              alt={`${anime.title} poster`}
              width={208}
              height={296}
              className="w-full aspect-[2/3] object-cover"
            />
            {anime.isAiring && (
              <div className="absolute top-2 left-2 flex items-center gap-1 bg-primary text-primary-foreground text-xs font-semibold px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground animate-pulse" />
                Airing
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 pt-2 space-y-4">
            {/* Breadcrumb */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Link href="/anime" className="hover:text-primary transition-colors">Anime</Link>
              <span>/</span>
              <span className="text-foreground">{anime.title}</span>
            </div>

            {/* Title + Japanese title */}
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-foreground leading-tight text-balance">
                {anime.title}
              </h1>
              {anime.jaTitle && (
                <p className="text-muted-foreground text-base mt-1" lang="ja">{anime.jaTitle}</p>
              )}
            </div>

            {/* Score + rank row */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <span className="text-foreground font-bold text-xl">{anime.score}</span>
                <span className="text-muted-foreground text-xs">/ 10</span>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Rank</p>
                <p className="text-foreground font-bold text-lg leading-tight">#{anime.rank}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Popularity</p>
                <p className="text-foreground font-bold text-lg leading-tight">#{anime.popularity}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Members</p>
                <p className="text-foreground font-bold text-lg leading-tight">{anime.members}</p>
              </div>
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2">
              {anime.genres.map((genre) => (
                <Link key={genre} href={`/anime/genres/${genre.toLowerCase()}`}>
                  <Badge
                    variant="secondary"
                    className="bg-secondary hover:bg-primary/20 hover:text-primary border border-border hover:border-primary/30 transition-colors cursor-pointer text-xs"
                  >
                    {genre}
                  </Badge>
                </Link>
              ))}
            </div>

            {/* Meta pills */}
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Tv className="w-3.5 h-3.5 text-primary" />
                <span>{anime.type}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span>{anime.season} {anime.year}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>{anime.episodes} episodes</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-primary" />
                <span>{anime.studio}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 pt-1">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 rounded-xl"
                asChild
              >
                <a href="#">
                  <Play className="w-4 h-4 fill-current" />
                  Watch Now
                </a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className={cn(
                  "border-border gap-2 rounded-xl transition-colors",
                  inList
                    ? "bg-primary/10 border-primary/40 text-primary"
                    : "text-foreground hover:bg-secondary"
                )}
                onClick={() => setInList(!inList)}
              >
                {inList ? (
                  <><BookmarkCheck className="w-4 h-4" /> In My List</>
                ) : (
                  <><Plus className="w-4 h-4" /> Add to List</>
                )}
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className={cn(
                  "gap-2 rounded-xl",
                  liked ? "text-rose-400 hover:text-rose-300" : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setLiked(!liked)}
                aria-label={liked ? "Unlike" : "Like"}
              >
                <Heart className={cn("w-4 h-4", liked && "fill-current")} />
                <span className="hidden sm:inline">{liked ? "Liked" : "Like"}</span>
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="gap-2 rounded-xl text-muted-foreground hover:text-foreground"
                aria-label="Share"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
