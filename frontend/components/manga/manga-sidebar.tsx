import type { MangaData } from "@/lib/types/manga"

interface MangaSidebarProps {
  manga: MangaData
}

const infoRows: { label: string; key: keyof MangaData }[] = [
  { label: "Type",     key: "type" },
  { label: "Chapters", key: "chapters" },
  { label: "Volumes",  key: "volumes" },
  { label: "Status",   key: "status" },
  { label: "Start Date", key: "year" },
  { label: "Source",   key: "source" },
]

export function MangaSidebar({ manga }: MangaSidebarProps) {
  return (
    <aside className="space-y-6">
      {/* Score breakdown - Placeholder */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Score Breakdown</h2>
        <div className="space-y-2.5">
          {manga.scoreBreakdown && manga.scoreBreakdown.length > 0 ? manga.scoreBreakdown.map((row) => (
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
          )) : (
            <p className="text-xs text-muted-foreground">No score breakdown available.</p>
          )}
        </div>
      </div>

      {/* Info table */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Information</h2>
        <dl className="space-y-2.5">
          {infoRows.map(({ label, key }) => (
            <div key={label} className="flex gap-2">
              <dt className="text-xs text-muted-foreground w-20 shrink-0 pt-0.5">{label}</dt>
              <dd className="text-xs text-foreground leading-relaxed">
                {String(manga[key] || "Unknown")}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Themes */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Themes</h2>
        <div className="flex flex-wrap gap-2">
          {manga.themes && manga.themes.length > 0 ? manga.themes.map((theme) => (
            <span
              key={theme}
              className="text-xs text-accent border border-accent/30 bg-accent/10 rounded-full px-2.5 py-1"
            >
              {theme}
            </span>
          )) : (
            <p className="text-xs text-muted-foreground">No themes available.</p>
          )}
        </div>
      </div>
    </aside>
  )
}
