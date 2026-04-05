import Image from "next/image"
import Link from "next/link"
import { Star, ChevronRight, Calendar, Flame } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const seasonalAnime = [
  {
    id: 1,
    slug: "celestial-chronicles",
    title: "Celestial Chronicles",
    score: 9.2,
    episodes: "24 eps",
    genres: ["Fantasy", "Action"],
    image: "/images/anime-1.jpg",
    isNew: true,
    popularity: "#1 this season",
  },
  {
    id: 2,
    slug: "beneath-april-skies",
    title: "Beneath April Skies",
    score: 8.4,
    episodes: "12 eps",
    genres: ["Romance", "Slice of Life"],
    image: "/images/anime-5.jpg",
    isNew: true,
    popularity: "#2 this season",
  },
  {
    id: 3,
    slug: "neon-detective",
    title: "Neon Detective",
    score: 8.3,
    episodes: "10 eps",
    genres: ["Mystery", "Thriller"],
    image: "/images/anime-6.jpg",
    isNew: false,
    popularity: "#3 this season",
  },
  {
    id: 4,
    slug: "iron-genesis-sigma",
    title: "Iron Genesis Sigma",
    score: 8.7,
    episodes: "26 eps",
    genres: ["Mecha", "Sci-Fi"],
    image: "/images/anime-3.jpg",
    isNew: false,
    popularity: "#4 this season",
  },
]

export function SeasonalSection() {
  return (
    <section className="py-16 bg-card/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-accent text-sm font-medium">
              <Calendar className="w-4 h-4" />
              <span>Spring 2025</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-foreground">This Season</h2>
          </div>
          <Link href="/seasonal" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
            Full Schedule <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {seasonalAnime.map((anime) => (
            <Link
              key={anime.id}
              href={`/anime/${anime.slug}`}
              className="group flex gap-4 bg-card border border-border rounded-xl p-3 hover:border-accent/40 hover:bg-card/80 transition-all duration-200"
            >
              <div className="relative w-16 h-24 rounded-lg overflow-hidden shrink-0">
                <Image
                  src={anime.image}
                  alt={anime.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="64px"
                />
                {anime.isNew && (
                  <div className="absolute top-1 left-1">
                    <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-medium">NEW</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                <div>
                  <p className="text-xs text-accent font-medium mb-1">{anime.popularity}</p>
                  <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                    {anime.title}
                  </h3>
                </div>
                <div className="space-y-1.5 mt-2">
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                    <span className="text-xs font-semibold text-foreground">{anime.score}</span>
                    <span className="text-xs text-muted-foreground ml-1">{anime.episodes}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {anime.genres.slice(0, 2).map((g) => (
                      <span key={g} className="text-xs px-1.5 py-0.5 bg-secondary rounded text-muted-foreground">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
