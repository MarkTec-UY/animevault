import Image from "next/image"
import Link from "next/link"
import { Calendar, Clock, Globe, Star, Tv } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { AnimeUserActions } from "@/components/anime/anime-user-actions"
import { AiringBadge } from "@/components/anime/airing-badge"
import type { AnimeData } from "@/lib/types/anime"

interface AnimeHeroProps {
  anime: AnimeData
}

export function AnimeHero({ anime }: AnimeHeroProps) {
  const studios = anime.companies?.filter((c) => c.isMain) ?? []
  const studioName = studios.length > 0 ? studios.map((s) => s.name).join(", ") : anime.studio

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

      {/* Main info -- overlaps the banner */}
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
            {anime.nextAiringAt && anime.nextAiringEpisode && (
              <AiringBadge
                nextAiringAt={anime.nextAiringAt}
                nextAiringEpisode={anime.nextAiringEpisode}
              />
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
            <div className="space-y-2">
              <h1 className="detail-title text-balance">
                {anime.title}
              </h1>
              {anime.jaTitle && (
                <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground/90 sm:text-base" lang="ja">{anime.jaTitle}</p>
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
                <span>{studioName}</span>
              </div>
            </div>

            {/* Action buttons */}
            <AnimeUserActions anime={anime} />
          </div>
        </div>
      </div>
    </section>
  )
}
