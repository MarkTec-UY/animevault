"use client"

import { useState } from "react"
import Image from "next/image"
import { Play, Star, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { AnimeData } from "@/lib/types/anime"

interface AnimeEpisodesProps {
  episodes: AnimeData["episodes_list"]
}

export function AnimeEpisodes({ episodes }: AnimeEpisodesProps) {
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? episodes : episodes.slice(0, 6)

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl text-foreground">Episodes</h2>
        <span className="text-sm text-muted-foreground">{episodes.length} episodes</span>
      </div>

      <div className="space-y-2">
        {visible.map((ep) => (
          <div
            key={ep.number}
            className="group flex items-center gap-4 p-3 rounded-xl bg-card border border-border hover:border-primary/30 hover:bg-card/80 transition-all duration-200 cursor-pointer"
          >
            {/* Thumbnail */}
            <div className="relative w-24 sm:w-32 aspect-video rounded-lg overflow-hidden shrink-0">
              <Image
                src={ep.thumbnail}
                alt={`Episode ${ep.number} thumbnail`}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-8 h-8 rounded-full bg-primary/90 flex items-center justify-center">
                  <Play className="w-3.5 h-3.5 fill-primary-foreground text-primary-foreground ml-0.5" />
                </div>
              </div>
              <span className="absolute bottom-1 left-1.5 text-xs font-bold text-white/90 bg-black/60 rounded px-1">
                Ep {ep.number}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                  {ep.title}
                </p>
                {ep.score && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    <span className="text-xs text-muted-foreground">{ep.score}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{ep.airDate}</span>
                <span>{ep.duration}</span>
                {ep.isFiller && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                    Filler
                  </Badge>
                )}
                {ep.isRecap && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-muted text-muted-foreground border-border">
                    Recap
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {episodes.length > 6 && (
        <Button
          variant="outline"
          className="w-full border-border text-muted-foreground hover:text-foreground hover:border-primary/40 gap-2"
          onClick={() => setShowAll(!showAll)}
        >
          <ChevronDown className={cn("w-4 h-4 transition-transform", showAll && "rotate-180")} />
          {showAll ? "Show Less" : `Show All ${episodes.length} Episodes`}
        </Button>
      )}
    </section>
  )
}
