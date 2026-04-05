import Link from "next/link"
import { Drama, Eye, Heart, Layers, Rocket, Sword, Zap } from "lucide-react"

import { formatCompactNumber } from "@/features/home/formatters"
import type { HomeGenre } from "@/features/home/types"

interface GenreSectionProps {
  items: HomeGenre[]
}

const genreIcons = {
  action: Sword,
  adventure: Rocket,
  drama: Drama,
  fantasy: Zap,
  mystery: Eye,
  romance: Heart,
} as const

const genreAccent = [
  "from-primary/20 to-primary/5 border-primary/20 hover:border-primary/50 text-primary",
  "from-accent/20 to-accent/5 border-accent/20 hover:border-accent/50 text-accent",
  "from-sky-500/20 to-sky-500/5 border-sky-500/20 hover:border-sky-500/50 text-sky-500",
  "from-amber-500/20 to-amber-500/5 border-amber-500/20 hover:border-amber-500/50 text-amber-500",
]

export function GenreSection({ items }: GenreSectionProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <section className="bg-card/30 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 space-y-2 text-center">
          <div className="flex items-center justify-center gap-2 text-sm font-medium text-primary">
            <Layers className="h-4 w-4" />
            <span>Browse by category</span>
          </div>
          <h2 className="font-serif text-3xl text-foreground sm:text-4xl">Explore Genres</h2>
          <p className="mx-auto max-w-lg text-sm leading-relaxed text-muted-foreground">
            These genre counts are coming directly from the catalog, so the home page
            reflects what is actually available in the database right now.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {items.map((genre, index) => {
            const Icon = genreIcons[genre.slug as keyof typeof genreIcons] ?? Layers
            const accent = genreAccent[index % genreAccent.length]

            return (
              <Link
                key={genre.slug}
                href={`/genre/${genre.slug}`}
                className={`group relative flex flex-col items-center gap-3 rounded-xl border bg-card bg-gradient-to-b p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/10 ${accent}`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card transition-transform duration-200 group-hover:scale-110">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-foreground">{genre.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatCompactNumber(genre.animeCount) ?? genre.animeCount} titles
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
