import { Lock } from "lucide-react"

import type { ProfileUser } from "@/lib/types/profile"

interface PrivateProfileProps {
  user: ProfileUser
}

export function PrivateProfile({ user }: PrivateProfileProps) {
  return (
    <div className="mx-auto mt-12 max-w-xl px-4">
      <div className="rounded-2xl border border-border bg-card p-10 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
          <Lock className="h-6 w-6" />
        </div>
        <h2 className="font-serif text-2xl text-foreground">
          This profile is private
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {user.name || user.username} has chosen to keep their anime activity
          private. Their library, favorites, and notifications aren&apos;t
          visible to other users.
        </p>
      </div>
    </div>
  )
}
