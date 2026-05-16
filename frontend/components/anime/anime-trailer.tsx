"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import Image from "next/image"
import { Play } from "lucide-react"
import type { Trailer } from "@/lib/types/anime"

const ReactPlayer = dynamic(() => import("react-player/youtube"), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-video bg-card rounded-xl animate-pulse" />
  ),
})

interface AnimeTrailerProps {
  trailer: Trailer
  title?: string
}

export function AnimeTrailer({ trailer, title }: AnimeTrailerProps) {
  const [playing, setPlaying] = useState(false)

  if (trailer.site !== "youtube" && trailer.site !== "YouTube") {
    return null
  }

  const videoUrl = `https://www.youtube.com/watch?v=${trailer.id}`

  return (
    <section className="space-y-4">
      <h2 className="font-serif text-2xl text-foreground">Trailer</h2>
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-card border border-border group">
        {!playing && trailer.thumbnail && (
          <button
            onClick={() => setPlaying(true)}
            className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer"
            aria-label={`Play trailer for ${title ?? "anime"}`}
          >
            <Image
              src={trailer.thumbnail}
              alt={`${title ?? "Anime"} trailer thumbnail`}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
            <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-primary/90 text-primary-foreground shadow-xl group-hover:scale-110 transition-transform">
              <Play className="w-7 h-7 fill-current ml-0.5" />
            </div>
          </button>
        )}
        <ReactPlayer
          url={videoUrl}
          playing={playing}
          controls
          width="100%"
          height="100%"
          onPlay={() => setPlaying(true)}
          style={{ position: "absolute", top: 0, left: 0 }}
        />
      </div>
    </section>
  )
}
