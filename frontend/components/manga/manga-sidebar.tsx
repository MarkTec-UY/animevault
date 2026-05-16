import { ExternalLink as ExternalLinkIcon } from "lucide-react"
import type { MangaData } from "@/lib/types/manga"

interface MangaSidebarProps {
  manga: MangaData
}

const infoRows: { label: string; getValue: (manga: MangaData) => string }[] = [
  { label: "Type", getValue: (m) => m.type },
  { label: "Chapters", getValue: (m) => m.chapters > 0 ? String(m.chapters) : "?" },
  { label: "Volumes", getValue: (m) => m.volumes > 0 ? String(m.volumes) : "?" },
  { label: "Status", getValue: (m) => m.status },
  { label: "Year", getValue: (m) => String(m.year) },
  { label: "Source", getValue: (m) => m.source },
]

export function MangaSidebar({ manga }: MangaSidebarProps) {
  const streamingLinks = manga.externalLinks?.filter((l) => l.type === "STREAMING") ?? []
  const infoLinks = manga.externalLinks?.filter((l) => l.type !== "STREAMING") ?? []

  return (
    <aside className="space-y-6">
      {/* Score breakdown */}
      {manga.scoreBreakdown && manga.scoreBreakdown.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Score Breakdown</h2>
          <div className="space-y-2.5">
            {manga.scoreBreakdown.map((row) => (
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
              <dd className="text-xs text-foreground leading-relaxed">{getValue(manga)}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Reading links */}
      {streamingLinks.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Read On</h2>
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
      {manga.themes && manga.themes.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Themes</h2>
          <div className="flex flex-wrap gap-2">
            {manga.themes.map((theme) => (
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
