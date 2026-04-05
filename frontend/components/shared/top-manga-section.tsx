import Image from "next/image"
import Link from "next/link"
import { Star, ChevronRight, BookOpen } from "lucide-react"

const topManga = [
  {
    id: 1,
    slug: "shattered-veil",
    title: "Shattered Veil",
    jaTitle: "砕かれた帳",
    author: "Katsuki Mori",
    score: 9.5,
    volumes: 22,
    chapters: 214,
    status: "Ongoing",
    genres: ["Action", "Adventure"],
    image: "/images/manga-1.jpg",
  },
  {
    id: 2,
    slug: "crimson-empress",
    title: "Crimson Empress",
    jaTitle: "紅の女帝",
    author: "Yuki Tanaka",
    score: 9.1,
    volumes: 15,
    chapters: 140,
    status: "Ongoing",
    genres: ["Fantasy", "Romance"],
    image: "/images/manga-2.jpg",
  },
  {
    id: 3,
    slug: "arcane-codex",
    title: "Arcane Codex",
    jaTitle: "秘術の法典",
    author: "Hiroshi Kato",
    score: 8.8,
    volumes: 8,
    chapters: 76,
    status: "Ongoing",
    genres: ["Magic", "Mystery"],
    image: "/images/manga-3.jpg",
  },
  {
    id: 4,
    slug: "neon-pulse",
    title: "Neon Pulse",
    jaTitle: "ネオンパルス",
    author: "Ren Ishikawa",
    score: 8.6,
    volumes: 6,
    chapters: 58,
    status: "Completed",
    genres: ["Cyberpunk", "Thriller"],
    image: "/images/manga-4.jpg",
  },
]

export function TopMangaSection() {
  return (
    <section className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary text-sm font-medium">
              <BookOpen className="w-4 h-4" />
              <span>Must Reads</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-foreground">Top Manga</h2>
          </div>
          <Link href="/manga/top" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
            Browse All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {topManga.map((manga, index) => (
            <Link
              key={manga.id}
              href={`/manga/${manga.slug}`}
              className="group bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 hover:shadow-xl hover:shadow-black/30"
            >
              {/* Cover art */}
              <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
                <Image
                  src={manga.image}
                  alt={manga.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                {/* Rank */}
                <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-md">
                  #{index + 1}
                </div>
                {/* Status */}
                <div className="absolute bottom-2 right-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${manga.status === "Ongoing" ? "bg-primary/90 text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {manga.status}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-4 space-y-2">
                <div>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {manga.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{manga.author}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-semibold text-foreground">{manga.score}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {manga.volumes} vols · {manga.chapters} ch
                  </span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {manga.genres.map((g) => (
                    <span key={g} className="text-xs px-2 py-0.5 bg-secondary rounded-full text-muted-foreground">
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
