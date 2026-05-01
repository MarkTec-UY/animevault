import { Globe2, Languages, Star } from "lucide-react"

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
  point_10_decimal: "10 Points (decimal)",
  point_10: "10 Points",
  star_5: "5 Stars",
}

interface ProfileMetaProps {
  user: ProfileUser
}

interface MetaCardProps {
  label: string
  value: string
  icon: React.ReactNode
}

function MetaCard({ label, value, icon }: MetaCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-sm font-semibold text-foreground">
          {value}
        </p>
      </div>
    </div>
  )
}

export function ProfileMeta({ user }: ProfileMetaProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <MetaCard
        label="Timezone"
        value={user.timezone || "Not set"}
        icon={<Globe2 className="h-5 w-5" />}
      />
      <MetaCard
        label="Title language"
        value={TITLE_LANGUAGE_LABEL[user.preferred_title_language]}
        icon={<Languages className="h-5 w-5" />}
      />
      <MetaCard
        label="Scoring system"
        value={SCORING_LABEL[user.preferred_scoring_system]}
        icon={<Star className="h-5 w-5" />}
      />
    </div>
  )
}
