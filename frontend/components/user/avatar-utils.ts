import type { ProfileUser } from "@/lib/types/profile"

export const DEFAULT_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%2363A375' width='100' height='100'/%3E%3Ccircle cx='50' cy='35' r='25' fill='%23fff'/%3E%3Cpath d='M20 90c0-16.5 13.5-30 30-30s30 13.5 30 30' fill='%23fff'/%3E%3C/svg%3E"

export function resolveAvatarUrl(
  user: Pick<ProfileUser, "avatar_url" | "avatar_path"> | null | undefined
): string {
  if (!user) return DEFAULT_AVATAR
  return user.avatar_url || user.avatar_path || DEFAULT_AVATAR
}

export function resolveBannerUrl(
  user: Pick<ProfileUser, "banner_url" | "banner_path"> | null | undefined
): string | null {
  if (!user) return null
  return user.banner_url || user.banner_path || null
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (!parts.length) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
