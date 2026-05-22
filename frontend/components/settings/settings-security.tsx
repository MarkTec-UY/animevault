import { CheckCircle2, Mail, ShieldAlert } from "lucide-react"

import type { ProfileUser } from "@/lib/types/profile"

interface SettingsSecurityProps {
  user: ProfileUser
}

export function SettingsSecurity({ user }: SettingsSecurityProps) {
  const verified = Boolean(user.email_verified_at)

  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-6">
      <div>
        <h3 className="panel-title">Account & security</h3>
        <p className="text-xs text-muted-foreground">
          Sensitive account details. Some actions require re-authentication.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-background/40 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
              <Mail className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Email
              </p>
              <p className="truncate text-sm font-medium text-foreground">
                {user.email ?? "—"}
              </p>
            </div>
          </div>
          {verified ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2 py-1 text-xs font-medium text-accent">
              <ShieldAlert className="h-3.5 w-3.5" />
              Not verified
            </span>
          )}
        </div>

        <div className="rounded-lg border border-dashed border-border bg-background/20 p-4 text-xs text-muted-foreground">
          To change your email or password, please contact support. These
          actions require additional verification.
        </div>
      </div>
    </section>
  )
}
