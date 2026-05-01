import {
  CheckCircle2,
  Circle,
  Eye,
  Library,
  ListTodo,
  PauseCircle,
  Star,
  XCircle,
} from "lucide-react"
import type { ProfileStatsSummary } from "@/lib/types/profile"

interface ProfileStatsProps {
  stats: ProfileStatsSummary
}

const STATUS_CARDS = [
  {
    key: "watching" as const,
    label: "Watching",
    icon: Eye,
    accent: "text-primary",
    bg: "bg-primary/10",
  },
  {
    key: "completed" as const,
    label: "Completed",
    icon: CheckCircle2,
    accent: "text-primary",
    bg: "bg-primary/10",
  },
  {
    key: "paused" as const,
    label: "Paused",
    icon: PauseCircle,
    accent: "text-accent",
    bg: "bg-accent/10",
  },
  {
    key: "dropped" as const,
    label: "Dropped",
    icon: XCircle,
    accent: "text-destructive",
    bg: "bg-destructive/10",
  },
  {
    key: "planning" as const,
    label: "Planning",
    icon: ListTodo,
    accent: "text-accent",
    bg: "bg-accent/10",
  },
]

export function ProfileStats({ stats }: ProfileStatsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Library className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Total
            </p>
            <p className="text-2xl font-semibold text-foreground">
              {stats.total}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Circle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Episodes
            </p>
            <p className="text-2xl font-semibold text-foreground">
              {stats.total_episodes.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <Star className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Mean score
            </p>
            <p className="text-2xl font-semibold text-foreground">
              {stats.mean_score > 0 ? stats.mean_score.toFixed(2) : "—"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {STATUS_CARDS.map(({ key, label, icon: Icon, accent, bg }) => (
          <div
            key={key}
            className="rounded-xl border border-border bg-card p-4"
          >
            <div
              className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg ${bg} ${accent}`}
            >
              <Icon className="h-4.5 w-4.5" />
            </div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p className="mt-0.5 text-xl font-semibold text-foreground">
              {stats[key]}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
