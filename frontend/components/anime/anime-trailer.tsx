"use client"

import { useState } from "react"
import { Play } from "lucide-react"
import ReactPlayer from "react-player"
import type { Trailer } from "@/lib/types/anime"

interface AnimeTrailerProps {
  trailer: Trailer
  title?: string
}

export function AnimeTrailer({ trailer, title }: AnimeTrailerProps) {
  const [playing, setPlaying] = useState(false)

  if (!trailer.id || (trailer.site !== "youtube" && trailer.site !== "YouTube")) {
    return null
  }

  const videoUrl = `https://www.youtube.com/watch?v=${trailer.id}`
  const previewLabel = `Play trailer for ${title ?? "anime"}`
  const lightPreview = trailer.thumbnail ? trailer.thumbnail : true

  return (
    <section className="space-y-4">
      <h2 className="font-serif text-2xl text-foreground">Trailer</h2>
      <div className="group relative w-full aspect-video overflow-hidden rounded-xl border border-border bg-card">
        <ReactPlayer
          src={videoUrl}
          light={lightPreview}
          fallback={<div className="h-full w-full animate-pulse bg-card" aria-hidden />}
          playIcon={
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/40">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-xl transition-transform group-hover:scale-110">
                <Play className="ml-0.5 h-7 w-7 fill-current" />
              </div>
            </div>
          }
          previewAriaLabel={previewLabel}
          previewTabIndex={0}
          playing={playing}
          controls
          playsInline
          width="100%"
          height="100%"
          config={{
            youtube: {
              rel: 0,
            },
          }}
          onClickPreview={() => setPlaying(true)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
        />
      </div>
    </section>
  )
}
