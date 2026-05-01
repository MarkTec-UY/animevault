import Link from "next/link"
import { CalendarDays, Globe2, Settings } from "lucide-react"

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

  return (
    <section className="relative">
      {/* Banner */}
      <div className="relative h-48 w-full overflow-hidden bg-secondary sm:h-64 lg:h-80">
        {banner ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={banner}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/30 via-secondary to-accent/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      </div>

      {/* Identity row */}
      <div className="mx-auto -mt-20 max-w-6xl px-4 sm:-mt-24 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:gap-6">
          <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-full border-4 border-background bg-secondary shadow-xl sm:h-40 sm:w-40">
            {avatar && avatar !== DEFAULT_AVATAR ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar}
                alt={user.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-primary text-3xl font-semibold text-primary-foreground sm:text-4xl">
                {getInitials(user.name || user.username)}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 pb-1">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <h1 className="truncate font-serif text-3xl font-normal text-foreground sm:text-4xl">
                  {user.name || user.username}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  @{user.username}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {joinDate && (
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" />
                      Joined {joinDate}
                    </span>
                  )}
                  {user.timezone && (
                    <span className="inline-flex items-center gap-1.5">
                      <Globe2 className="h-3.5 w-3.5" />
                      {user.timezone}
                    </span>
                  )}
                  {!user.is_profile_public && (
                    <span className="inline-flex items-center rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Private profile
                    </span>
                  )}
                </div>
              </div>

              {isOwnProfile && (
                <Button asChild variant="outline" size="sm">
                  <Link href="/settings">
                    <Settings className="mr-1.5 h-4 w-4" />
                    Edit profile
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* About me */}
        {user.about_me && (
          <p className="mt-6 max-w-3xl whitespace-pre-line text-sm leading-relaxed text-muted-foreground sm:text-base">
            {user.about_me}
          </p>
        )}
      </div>
    </section>
  )
}
