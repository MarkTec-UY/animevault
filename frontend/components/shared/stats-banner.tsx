import { Users, Film, BookOpen, Star } from "lucide-react"

const stats = [
  { label: "Anime Titles", value: "18,400+", icon: Film, description: "From classic to seasonal" },
  { label: "Manga Series", value: "71,200+", icon: BookOpen, description: "Across all genres" },
  { label: "Active Users", value: "2.4M+", icon: Users, description: "Tracking their lists" },
  { label: "Reviews & Ratings", value: "9.8M+", icon: Star, description: "From the community" },
]

export function StatsBanner() {
  return (
    <section className="py-14 bg-background border-y border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-serif text-3xl sm:text-4xl font-normal text-foreground">{stat.value}</p>
                <p className="text-sm font-semibold text-foreground mt-0.5">{stat.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
