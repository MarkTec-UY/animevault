import Image from "next/image"
import Link from "next/link"
import { BookOpen, Calendar, Globe, Star, Layers, Heart, Plus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { MangaData } from "@/lib/types/manga"

interface MangaHeroProps {
  manga: MangaData
}

export function MangaHero({ manga }: MangaHeroProps) {
  return (
    <section className="relative">
      {/* Banner */}
      <div className="relative h-72 sm:h-96 overflow-hidden">
        <Image
          src={manga.banner}
          alt={`${manga.title} banner`}
          fill
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/50 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/60 to-transparent" />
      </div>

      {/* Main info -- overlaps the banner */}
      <div className="relative -mt-24 sm:-mt-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-0">
        <div className="flex flex-col sm:flex-row gap-6 lg:gap-8 items-start">
          {/* Poster */}
          <div className="relative w-36 sm:w-44 lg:w-52 shrink-0 rounded-xl overflow-hidden border-2 border-border shadow-2xl shadow-black/60 self-end sm:self-auto">
            <Image
              src={manga.poster}
              alt={`${manga.title} poster`}
              width={208}
              height={296}
              className="w-full aspect-[2/3] object-cover"
            />
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 pt-2 space-y-4">
            {/* Breadcrumb */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Link href="/manga" className="hover:text-primary transition-colors">Manga</Link>
              <span>/</span>
              <span className="text-foreground">{manga.title}</span>
            </div>

            {/* Title + Japanese title */}
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-foreground leading-tight text-balance">
                {manga.title}
              </h1>
              {manga.jaTitle && (
                <p className="text-muted-foreground text-base mt-1" lang="ja">{manga.jaTitle}</p>
              )}
            </div>

            {/* Score + rank row */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <span className="text-foreground font-bold text-xl">{manga.score}</span>
                <span className="text-muted-foreground text-xs">/ 10</span>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Rank</p>
                <p className="text-foreground font-bold text-lg leading-tight">#{manga.rank || "N/A"}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Popularity</p>
                <p className="text-foreground font-bold text-lg leading-tight">#{manga.popularity}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Members</p>
                <p className="text-foreground font-bold text-lg leading-tight">{manga.members}</p>
              </div>
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2">
              {manga.genres.map((genre) => (
                <Link key={genre} href={`/manga?genres=${genre}`}>
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
                <BookOpen className="w-3.5 h-3.5 text-primary" />
                <span>{manga.type}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span>{manga.year}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-primary" />
                <span>{manga.chapters > 0 ? `${manga.chapters} chapters` : "Chapters: TBA"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-primary" />
                <span>{manga.source}</span>
              </div>
            </div>

            {/* Action buttons -- pill-style to match anime redesign */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 rounded-full px-6 font-medium"
                asChild
              >
                <a href="/login">
                  <Plus className="w-4 h-4" />
                  Sign in to track
                </a>
              </Button>

              <button
                aria-label="Add to favorites"
                className="flex items-center justify-center w-10 h-10 rounded-full bg-card border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all duration-200"
              >
                <Heart className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
