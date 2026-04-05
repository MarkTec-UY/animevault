import Link from "next/link"
import { Layers, Sword, Heart, Zap, Ghost, Rocket, Drama, Music, Laugh, Eye } from "lucide-react"

const genres = [
  { name: "Action", href: "/genre/action", icon: Sword, color: "from-red-500/20 to-red-500/5", accent: "text-red-400", border: "border-red-500/20 hover:border-red-400/50", count: "2,340" },
  { name: "Romance", href: "/genre/romance", icon: Heart, color: "from-pink-500/20 to-pink-500/5", accent: "text-pink-400", border: "border-pink-500/20 hover:border-pink-400/50", count: "1,820" },
  { name: "Fantasy", href: "/genre/fantasy", icon: Zap, color: "from-yellow-500/20 to-yellow-500/5", accent: "text-yellow-400", border: "border-yellow-500/20 hover:border-yellow-400/50", count: "3,105" },
  { name: "Horror", href: "/genre/horror", icon: Ghost, color: "from-purple-500/20 to-purple-500/5", accent: "text-purple-400", border: "border-purple-500/20 hover:border-purple-400/50", count: "645" },
  { name: "Sci-Fi", href: "/genre/sci-fi", icon: Rocket, color: "from-blue-500/20 to-blue-500/5", accent: "text-blue-400", border: "border-blue-500/20 hover:border-blue-400/50", count: "1,260" },
  { name: "Drama", href: "/genre/drama", icon: Drama, color: "from-orange-500/20 to-orange-500/5", accent: "text-orange-400", border: "border-orange-500/20 hover:border-orange-400/50", count: "2,080" },
  { name: "Music", href: "/genre/music", icon: Music, color: "from-teal-500/20 to-teal-500/5", accent: "text-teal-400", border: "border-teal-500/20 hover:border-teal-400/50", count: "385" },
  { name: "Comedy", href: "/genre/comedy", icon: Laugh, color: "from-lime-500/20 to-lime-500/5", accent: "text-lime-400", border: "border-lime-500/20 hover:border-lime-400/50", count: "1,570" },
  { name: "Mystery", href: "/genre/mystery", icon: Eye, color: "from-indigo-500/20 to-indigo-500/5", accent: "text-indigo-400", border: "border-indigo-500/20 hover:border-indigo-400/50", count: "890" },
  { name: "All Genres", href: "/genres", icon: Layers, color: "from-primary/20 to-primary/5", accent: "text-primary", border: "border-primary/20 hover:border-primary/50", count: "30+" },
]

export function GenreSection() {
  return (
    <section className="py-16 bg-card/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 space-y-2">
          <div className="flex items-center justify-center gap-2 text-primary text-sm font-medium">
            <Layers className="w-4 h-4" />
            <span>Browse by Category</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl text-foreground">Explore Genres</h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm leading-relaxed">
            From pulse-pounding action to heartfelt romance — find exactly the kind of story you&apos;re in the mood for.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {genres.map((genre) => (
            <Link
              key={genre.name}
              href={genre.href}
              className={`group relative flex flex-col items-center gap-3 p-5 rounded-xl border bg-card bg-gradient-to-b ${genre.color} ${genre.border} transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20`}
            >
              <div className={`w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                <genre.icon className={`w-5 h-5 ${genre.accent}`} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">{genre.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{genre.count} titles</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
