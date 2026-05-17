import { ExternalLink as ExternalLinkIcon, Building2, Film } from "lucide-react"
import type { AnimeData } from "@/lib/types/anime"

interface AnimeSidebarProps {
  anime: AnimeData
}

const infoRows: { label: string; getValue: (anime: AnimeData) => string }[] = [
  { label: "Type", getValue: (a) => a.type },
  { label: "Episodes", getValue: (a) => String(a.episodes || "?") },
  { label: "Duration", getValue: (a) => a.duration },
  { label: "Status", getValue: (a) => a.status },
  { label: "Season", getValue: (a) => `${a.season} ${a.year}` },
  { label: "Source", getValue: (a) => a.source },
  { label: "Rating", getValue: (a) => a.rating },
]

export function AnimeSidebar({ anime }: AnimeSidebarProps) {
  const studios = anime.companies?.filter((c) => c.isMain) ?? []
  const producers = anime.companies?.filter((c) => !c.isMain) ?? []
  const streamingLinks = anime.externalLinks?.filter((l) => l.type === "STREAMING") ?? []
  const infoLinks = anime.externalLinks?.filter((l) => l.type !== "STREAMING") ?? []

  return (
    <aside className="space-y-6">
      {/* Score breakdown */}
      {anime.scoreBreakdown.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Score Breakdown</h2>
          <div className="space-y-2.5">
            {anime.scoreBreakdown.map((row) => (
              <div key={row.label} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-7 shrink-0 text-right">{row.label}</span>
                <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${row.value}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-10 shrink-0">{row.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Information */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Information</h2>
        <dl className="space-y-2.5">
          {infoRows.map(({ label, getValue }) => (
            <div key={label} className="flex gap-2">
              <dt className="text-xs text-muted-foreground w-20 shrink-0 pt-0.5">{label}</dt>
              <dd className="text-xs text-foreground leading-relaxed">{getValue(anime)}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Studios */}
      {studios.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
            <Film className="w-3.5 h-3.5 text-primary" />
            Studios
          </h2>
          <div className="flex flex-wrap gap-2">
            {studios.map((studio) => (
              <span
                key={studio.id}
                className="text-xs text-primary border border-primary/30 bg-primary/10 rounded-full px-3 py-1 font-medium"
              >
                {studio.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Producers */}
      {producers.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-accent" />
            Producers
          </h2>
          <div className="flex flex-wrap gap-2">
            {producers.map((producer) => (
              <span
                key={producer.id}
                className="text-xs text-accent border border-accent/30 bg-accent/10 rounded-full px-3 py-1"
              >
                {producer.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Streaming links */}
      {streamingLinks.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Watch On</h2>
          <div className="space-y-2">
            {streamingLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors group"
              >
                <ExternalLinkIcon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary" />
                <span>{link.site}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* External links */}
      {infoLinks.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">External Links</h2>
          <div className="space-y-2">
            {infoLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors group"
              >
                <ExternalLinkIcon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary" />
                <span>{link.site}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Themes */}
      {anime.themes.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Themes</h2>
          <div className="flex flex-wrap gap-2">
            {anime.themes.map((theme) => (
              <span
                key={theme}
                className="text-xs text-accent border border-accent/30 bg-accent/10 rounded-full px-2.5 py-1"
              >
                {theme}
              </span>
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}
