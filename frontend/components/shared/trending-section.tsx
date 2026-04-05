"use client"

import Image from "next/image"
import Link from "next/link"
import { Star, Plus, TrendingUp, ChevronRight, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const trendingAnime = [
  {
    id: 1,
    slug: "celestial-chronicles",
    title: "Celestial Chronicles",
    jaTitle: "天界年代記",
    score: 9.2,
    episodes: 24,
    status: "Airing",
    genres: ["Fantasy", "Action"],
    image: "/images/anime-1.jpg",
    rank: 1,
    trend: "+3",
  },
  {
    id: 2,
    slug: "shadow-mage-academy",
    title: "Shadow Mage Academy",
    jaTitle: "影魔法士学院",
    score: 8.9,
    episodes: 12,
    status: "Airing",
    genres: ["Magic", "Drama"],
    image: "/images/anime-2.jpg",
    rank: 2,
    trend: "+1",
  },
  {
    id: 3,
    slug: "iron-genesis-sigma",
    title: "Iron Genesis Sigma",
    jaTitle: "鉄創生シグマ",
    score: 8.7,
    episodes: 26,
    status: "Airing",
    genres: ["Mecha", "Sci-Fi"],
    image: "/images/anime-3.jpg",
    rank: 3,
    trend: "+5",
  },
  {
    id: 4,
    slug: "blade-of-the-east",
    title: "Blade of the East",
    jaTitle: "東の剣",
    score: 8.5,
    episodes: 13,
    status: "Completed",
    genres: ["Samurai", "Historical"],
    image: "/images/anime-4.jpg",
    rank: 4,
    trend: "-1",
  },
  {
    id: 5,
    slug: "beneath-april-skies",
    title: "Beneath April Skies",
    jaTitle: "四月の空の下",
    score: 8.4,
    episodes: 12,
    status: "Airing",
    genres: ["Romance", "Slice of Life"],
    image: "/images/anime-5.jpg",
    rank: 5,
    trend: "+8",
  },
  {
    id: 6,
    slug: "neon-detective",
    title: "Neon Detective",
    jaTitle: "ネオン探偵",
    score: 8.3,
    episodes: 10,
    status: "Airing",
    genres: ["Mystery", "Thriller"],
    image: "/images/anime-6.jpg",
    rank: 6,
    trend: "+2",
  },
]

function AnimeCard({ anime }: { anime: (typeof trendingAnime)[0] }) {
  return (
    <Link
      href={`/anime/${anime.slug}`}
      className="group relative flex flex-col bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30"
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] overflow-hidden bg-secondary">
        <Image
          src={anime.image}
          alt={anime.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
        />
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Rank badge */}
        <div className="absolute top-2 left-2 w-7 h-7 bg-background/80 backdrop-blur-sm rounded-md flex items-center justify-center">
          <span className="text-xs font-bold text-primary">#{anime.rank}</span>
        </div>

        {/* Status badge */}
        <div className="absolute top-2 right-2">
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              anime.status === "Airing"
                ? "bg-primary/90 text-primary-foreground"
                : "bg-secondary/90 text-muted-foreground"
            }`}
          >
            {anime.status === "Airing" ? "Live" : "Done"}
          </span>
        </div>

        {/* Hover quick-add */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
          <button
            className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs px-3 py-1.5 rounded-full hover:bg-primary/90 transition-colors"
            aria-label={`Add ${anime.title} to list`}
            onClick={(e) => e.preventDefault()}
          >
            <Plus className="w-3 h-3" />
            Add to List
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 space-y-2 flex-1 flex flex-col">
        <div>
          <h3 className="text-sm font-semibold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-1">
            {anime.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{anime.jaTitle}</p>
        </div>

        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            <span className="text-xs font-semibold text-foreground">{anime.score}</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-primary" />
            <span className="text-xs text-primary font-medium">{anime.trend}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {anime.genres.slice(0, 2).map((g) => (
            <span key={g} className="text-xs px-2 py-0.5 bg-secondary rounded-full text-muted-foreground">
              {g}
            </span>
          ))}
        </div>
      </div>
    </Link>
  )
}

export function TrendingSection() {
  return (
    <section className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-8">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary text-sm font-medium">
              <TrendingUp className="w-4 h-4" />
              <span>Right Now</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-foreground">Trending Anime</h2>
          </div>
          <Link
            href="/anime/trending"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {trendingAnime.map((anime) => (
            <AnimeCard key={anime.id} anime={anime} />
          ))}
        </div>
      </div>
    </section>
  )
}
