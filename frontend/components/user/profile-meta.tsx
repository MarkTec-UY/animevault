import { Globe2, Languages, Star, Settings2 } from "lucide-react"

import type {
  ProfileUser,
  ScoringSystem,
  TitleLanguage,
} from "@/lib/types/profile"

const TITLE_LANGUAGE_LABEL: Record<TitleLanguage, string> = {
  romaji: "Romaji",
  english: "English",
  native: "Native (Japanese)",
}

const SCORING_LABEL: Record<ScoringSystem, string> = {
  point_100: "100 Points",
  point_10_decimal: "10.0 Points",
  point_10: "10 Points",
  star_5: "5 Stars",
}

interface ProfileMetaProps {
  user: ProfileUser
}

function MetaCard({
  label,
  value,
  icon,
  color
}: {
  label: string
  value: string
  icon: React.ReactNode
  color: string
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-md hover:shadow-primary/5">
      <div className={`flex items-center gap-3`}>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color} bg-gradient-to-br`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground">
            {label}
          </p>
          <p className="truncate text-sm font-semibold text-foreground">
            {value}
          </p>
        </div>
      </div>
    </div>
  )
}

export function ProfileMeta({ user }: ProfileMetaProps) {
  const formatTimezone = (tz: string | null | undefined): string => {
    if (!tz) return "Not set"
    const parts = tz.split('/')
    return parts[1]?.replace('_', ' ') || tz
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Settings2 className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold text-foreground">Preferences</h3>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetaCard
          label="Timezone"
          value={formatTimezone(user.timezone)}
          icon={<Globe2 className="h-5 w-5" />}
          color="from-emerald-500/20 to-emerald-600/10"
        />
        <MetaCard
          label="Title Language"
          value={TITLE_LANGUAGE_LABEL[user.preferred_title_language]}
          icon={<Languages className="h-5 w-5" />}
          color="from-purple-500/20 to-purple-600/10"
        />
        <MetaCard
          label="Scoring System"
          value={SCORING_LABEL[user.preferred_scoring_system]}
          icon={<Star className="h-5 w-5" />}
          color="from-amber-500/20 to-amber-600/10"
        />
      </div>
    </div>
  )
}
