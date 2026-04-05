import Image from "next/image"
import Link from "next/link"
import { Play, Plus, Star, ChevronRight, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const featuredAnime = {
  title: "Celestial Chronicles",
  jaTitle: "天界年代記",
  episode: "Episode 12",
  year: "2025",
  season: "Spring",
  rating: 9.2,
  votes: "142K",
  genres: ["Fantasy", "Action", "Drama"],
  synopsis:
    "In a world where celestial beings and mortals clash for the fate of creation, a young warrior discovers he carries the power of a forgotten god within him. As ancient prophecies unravel and alliances crumble, he must master his power before the seven seals that bind chaos are broken forever.",
  image: "/images/featured-anime.jpg",
}

const spotlightItems = [
  { rank: 1, title: "Celestial Chronicles", score: 9.2, image: "/images/anime-1.jpg" },
  { rank: 2, title: "Shadow Mage Academy", score: 8.9, image: "/images/anime-2.jpg" },
  { rank: 3, title: "Iron Genesis Sigma", score: 8.7, image: "/images/anime-3.jpg" },
]

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col justify-end overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/images/hero-bg.jpg"
          alt="AnimeVault hero background — cinematic anime landscape"
          fill
          priority
          className="object-cover object-center"
        />
        {/* Dark gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        {/* Subtle noise texture overlay */}
        <div className="absolute inset-0 bg-background/10" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 pt-32 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
          {/* Main featured content */}
          <div className="lg:col-span-7 space-y-6">
            {/* Label */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-primary/20 border border-primary/30 text-primary rounded-full px-3 py-1 text-xs font-medium">
                <TrendingUp className="w-3 h-3" />
                <span>Featured This Season</span>
              </div>
              <Badge variant="secondary" className="bg-accent/20 border-accent/30 text-accent text-xs">
                {featuredAnime.season} {featuredAnime.year}
              </Badge>
            </div>

            {/* Title */}
            <div className="space-y-1">
              <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl text-foreground leading-tight text-balance">
                {featuredAnime.title}
              </h1>
              <p className="text-muted-foreground text-lg font-noto-jp" lang="ja">
                {featuredAnime.jaTitle}
              </p>
            </div>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-foreground font-semibold">{featuredAnime.rating}</span>
                <span className="text-muted-foreground">({featuredAnime.votes} votes)</span>
              </div>
              <span className="text-border">|</span>
              <span className="text-muted-foreground">{featuredAnime.episode}</span>
              <span className="text-border">|</span>
              <div className="flex flex-wrap gap-2">
                {featuredAnime.genres.map((genre) => (
                  <span
                    key={genre}
                    className="px-2.5 py-0.5 rounded-full text-xs bg-secondary text-muted-foreground border border-border"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>

            {/* Synopsis */}
            <p className="text-muted-foreground leading-relaxed max-w-xl text-sm sm:text-base line-clamp-3">
              {featuredAnime.synopsis}
            </p>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 rounded-xl">
                <Play className="w-4 h-4 fill-current" />
                Watch Now
              </Button>
              <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-secondary gap-2 rounded-xl">
                <Plus className="w-4 h-4" />
                Add to List
              </Button>
              <Button size="lg" variant="ghost" className="text-muted-foreground hover:text-foreground gap-1 rounded-xl">
                More Info
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Spotlight sidebar */}
          <div className="lg:col-span-5 hidden lg:block">
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Spotlight</h2>
                <Link href="/rankings" className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
                  View All <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              {spotlightItems.map((item) => (
                <Link
                  key={item.rank}
                  href={`/anime/${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                  className="flex items-center gap-4 p-3 rounded-xl bg-card/50 border border-border/50 hover:bg-card hover:border-border transition-all duration-200 group"
                >
                  <span className="text-2xl font-bold text-primary/60 font-serif w-8 shrink-0">
                    {String(item.rank).padStart(2, "0")}
                  </span>
                  <div className="relative w-12 h-16 rounded-md overflow-hidden shrink-0">
                    <Image src={item.image} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-xs text-muted-foreground">{item.score}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  )
}
