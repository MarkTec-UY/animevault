import Link from "next/link"
import { CalendarDays, Globe2, Settings, User as UserIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { ProfileUser } from "@/lib/types/profile"
import {
  DEFAULT_AVATAR,
  getInitials,
  resolveAvatarUrl,
  resolveBannerUrl,
} from "./avatar-utils"

interface ProfileBannerProps {
  user: ProfileUser
  isOwnProfile: boolean
}

function formatJoinDate(date?: string | null): string | null {
  if (!date) return null
  try {
    return new Date(date).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
    })
  } catch {
    return null
  }
}

export function ProfileBanner({ user, isOwnProfile }: ProfileBannerProps) {
  const banner = resolveBannerUrl(user)
  const avatar = resolveAvatarUrl(user)
  const joinDate = formatJoinDate(user.created_at)

  const isDefaultAvatar = !avatar || avatar === DEFAULT_AVATAR

return (
    <section className="relative">
      {/* Identity row - on top of banner */}
      <div className="relative z-10 mx-auto max-w-6xl px-4 pt-48 sm:pt-56 lg:pt-72 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:gap-6">
          {/* Avatar - overlap banner */}
          <div className="relative shrink-0 -mt-12 sm:-mt-14">
            <div className="relative h-28 w-28 overflow-hidden rounded-2xl border-4 border-background shadow-2xl ring-2 ring-background sm:h-32 sm:w-32">
              {isDefaultAvatar ? (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-500 to-emerald-600">
                  <UserIcon className="h-12 w-12 text-white/90" />
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatar}
                  alt={user.name}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            {isOwnProfile && (
              <Link
                href="/settings"
                className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110 hover:bg-primary/90"
              >
                <Settings className="h-4 w-4" />
              </Link>
            )}
          </div>

          {/* User info */}
          <div className="min-w-0 flex-1 pb-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h1 className="truncate font-serif text-2xl font-bold text-foreground sm:text-3xl">
                  {user.name || user.username}
                </h1>
                <p className="text-sm text-muted-foreground">
                  @{user.username}
                </p>
              </div>

              {!isOwnProfile && (
                <Button size="sm" className="bg-primary hover:bg-primary/90">
                  Follow
                </Button>
              )}
            </div>

            {/* Meta info */}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {joinDate && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/50 px-3 py-1 text-xs">
                  <CalendarDays className="h-3.5 w-3.5 text-primary" />
                  Joined {joinDate}
                </span>
              )}
              {user.timezone && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/50 px-3 py-1 text-xs">
                  <Globe2 className="h-3.5 w-3.5 text-primary" />
                  {user.timezone.split('/')[1]?.replace('_', ' ') || user.timezone}
                </span>
              )}
              {!user.is_profile_public && (
                <span className="inline-flex items-center rounded-full bg-amber-500/20 border border-amber-500/30 px-3 py-1 text-xs text-amber-600 dark:text-amber-400">
                  🔒 Private
                </span>
              )}
            </div>
          </div>
        </div>

        {/* About me */}
        {user.about_me && (
          <div className="mt-6 max-w-3xl">
            <p className="whitespace-pre-line text-base leading-relaxed text-muted-foreground">
              {user.about_me}
            </p>
          </div>
        )}
      </div>

      {/* Banner - behind identity row */}
      <div className="absolute left-0 right-0 top-0 h-48 w-full overflow-hidden sm:h-56 lg:h-96">
        {banner ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={banner}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-r from-emerald-900 via-slate-900 to-purple-950" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>
    </section>
  )
}
