import Link from "next/link"
import { Bell, Dot } from "lucide-react"

import type { NotificationItem } from "@/lib/types/profile"

interface ProfileNotificationsProps {
  notifications: NotificationItem[]
}

function timeAgo(date: string): string {
  const ms = Date.now() - new Date(date).getTime()
  if (Number.isNaN(ms)) return ""
  const sec = Math.floor(ms / 1000)
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const days = Math.floor(hr / 24)
  if (days < 7) return `${days}d ago`
  return new Date(date).toLocaleDateString()
}

export function ProfileNotifications({
  notifications,
}: ProfileNotificationsProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-primary" />
        <h2 className="font-serif text-2xl text-foreground">
          Recent notifications
        </h2>
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 px-6 py-12 text-center">
          <Bell className="mb-2 h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">All caught up</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => {
            const isUnread = !n.read_at
            const content = (
              <div
                className={`flex items-start gap-3 rounded-xl border p-4 transition-colors ${
                  isUnread
                    ? "border-primary/30 bg-primary/5"
                    : "border-border bg-card"
                }`}
              >
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {n.title}
                    </p>
                    {isUnread && (
                      <Dot className="h-5 w-5 text-primary" aria-label="Unread" />
                    )}
                  </div>
                  {(n.body ?? n.message) && (
                    <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                      {n.body ?? n.message}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {timeAgo(n.created_at)}
                  </p>
                </div>
              </div>
            )

            return (
              <li key={n.id}>
                {n.anime?.id ? (
                  <Link href={`/anime/${n.anime.id}`} className="block">
                    {content}
                  </Link>
                ) : (
                  content
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
