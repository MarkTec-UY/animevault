import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ProfileBanner } from "@/components/user/profile-banner"
import { ProfileFavorites } from "@/components/user/profile-favorites"
import { ProfileLibrary } from "@/components/user/profile-library"
import { ProfileMeta } from "@/components/user/profile-meta"
import { ProfileNotifications } from "@/components/user/profile-notifications"
import { ProfileStats } from "@/components/user/profile-stats"
import { PrivateProfile } from "@/components/user/private-profile"
import { getProfilePayload } from "@/lib/server/profile-data"

interface UserPageProps {
  params: Promise<{ username: string }>
}

export async function generateMetadata({
  params,
}: UserPageProps): Promise<Metadata> {
  const { username } = await params
  return {
    title: `${username} — AnimeVault`,
    description: `${username}'s anime library, favorites, and stats on AnimeVault.`,
  }
}

export default async function UserProfilePage({ params }: UserPageProps) {
  const { username } = await params
  const payload = await getProfilePayload(username)

  if (!payload) {
    notFound()
  }

  const { user, is_own_profile, stats, library, favorites, notifications } =
    payload

  // Private profile and viewer is not the owner
  if (!user.is_profile_public && !is_own_profile) {
    return (
      <main className="min-h-screen bg-background pb-16 pt-16">
        <ProfileBanner user={user} isOwnProfile={false} />
        <PrivateProfile user={user} />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-16 pt-16">
      <ProfileBanner user={user} isOwnProfile={is_own_profile} />

      <div className="mx-auto mt-10 max-w-6xl space-y-10 px-4 sm:px-6 lg:px-8">
        <ProfileMeta user={user} />
        <ProfileStats stats={stats} />

        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          <div className="min-w-0 space-y-10">
            <ProfileLibrary
              library={library}
              ownerName={user.name || user.username}
            />
            <ProfileFavorites favorites={favorites} />
          </div>

          {is_own_profile && (
            <aside className="space-y-6">
              <ProfileNotifications notifications={notifications ?? []} />
            </aside>
          )}
        </div>
      </div>
    </main>
  )
}
