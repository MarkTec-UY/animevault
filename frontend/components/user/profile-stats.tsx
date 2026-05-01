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
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    ring: "ring-emerald-500/20",
  },
  {
    key: "completed" as const,
    label: "Completed",
    icon: CheckCircle2,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    ring: "ring-blue-500/20",
  },
  {
    key: "paused" as const,
    label: "Paused",
    icon: PauseCircle,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    ring: "ring-amber-500/20",
  },
  {
    key: "dropped" as const,
    label: "Dropped",
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-500/10",
    ring: "ring-red-500/20",
  },
  {
    key: "planning" as const,
    label: "Plan to Watch",
    icon: ListTodo,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    ring: "ring-purple-500/20",
  },
]

export function ProfileStats({ stats }: ProfileStatsProps) {
  return (
    <div className="space-y-6">
      {/* Main stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10">
              <Library className="h-5 w-5 text-emerald-500" />
            </div>
            <p className="mt-3 text-3xl font-bold text-foreground">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total Anime</p>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all hover:border-blue-30 hover:shadow-lg hover:shadow-blue-500/5">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10">
              <Circle className="h-5 w-5 text-blue-500" />
            </div>
            <p className="mt-3 text-3xl font-bold text-foreground">
              {stats.total_episodes > 1000 
                ? `${(stats.total_episodes / 1000).toFixed(1)}k` 
                : stats.total_episodes.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">Episodes Watched</p>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all hover:border-amber-30 hover:shadow-lg hover:shadow-amber-500/5">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10">
              <Star className="h-5 w-5 text-amber-500" />
            </div>
            <p className="mt-3 text-3xl font-bold text-foreground">
              {stats.mean_score > 0 ? stats.mean_score.toFixed(1) : "—"}
            </p>
            <p className="text-sm text-muted-foreground">Mean Score</p>
          </div>
        </div>
      </div>

      {/* Status breakdown */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-foreground">Status Breakdown</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {STATUS_CARDS.map(({ key, label, icon: Icon, color, bg, ring }) => (
            <div
              key={key}
              className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-all hover:border-border/80 hover:shadow-md"
            >
              <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${bg} ring-1 ${ring}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <p className="text-2xl font-bold text-foreground">{stats[key]}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
