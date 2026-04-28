"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { ProfileHeader } from "@/components/user/profile-header"
import { ProfileStats } from "@/components/user/profile-stats"
import { ProfileTabs } from "@/components/user/profile-tabs"
import { ProfileEditForm } from "@/components/user/profile-edit-form"
import { userAPI } from "@/lib/api/user"
import { authAPI } from "@/lib/api/auth"
import type { UserProfile, LibraryEntry, FavoriteAnime } from "@/lib/types/user"
import { Loader2 } from "lucide-react"
import { useParams } from "next/navigation"

interface ProfilePageProps {
  params: {
    username: string
  }
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const { username } = params
  const [isEditing, setIsEditing] = useState(false)

  // Fetch current user to check if this is their own profile
  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: () => authAPI.getCurrentUser(),
  })

  // Fetch profile by username
  const {
    data: profile,
    isLoading: profileLoading,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ["user-profile", username],
    queryFn: () => userAPI.getPublicProfile(username),
  })

  // Fetch user library
  const { data: libraryData, isLoading: libraryLoading } = useQuery({
    queryKey: ["user-library", username],
    queryFn: () => userAPI.getUserLibrary(username, { per_page: 12 }),
    enabled: !!profile,
  })

  // Fetch user favorites
  const { data: favoritesData, isLoading: favoritesLoading } = useQuery({
    queryKey: ["user-favorites", username],
    queryFn: () => userAPI.getUserFavorites(username),
    enabled: !!profile,
  })

  const isOwnProfile = currentUser?.username === username

  const handleUpdateProfile = async (data: any) => {
    await userAPI.updateProfile(data)
    // Refetch profile data to show updated information
    await refetchProfile()
  }

  if (profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold">Profile not found</p>
          <p className="text-sm text-muted-foreground">
            The user profile you're looking for doesn't exist or is not publicly visible.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <ProfileHeader
        profile={profile}
        isOwnProfile={isOwnProfile}
        onEditClick={() => setIsEditing(true)}
      />

      <div className="container mx-auto px-4 py-8">
        <ProfileStats stats={profile.stats} loading={profileLoading} />

        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {isOwnProfile ? "My Anime Collection" : `${profile.username}'s Anime Collection`}
            </h2>
            {isOwnProfile && (
              <ProfileEditForm
                profile={profile}
                onUpdate={handleUpdateProfile}
                trigger={
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Edit Preferences
                  </button>
                }
              />
            )}
          </div>
          <ProfileTabs
            library={libraryData?.data || []}
            favorites={favoritesData?.data || []}
            loading={libraryLoading || favoritesLoading}
          />
        </div>
      </div>
    </div>
  )
}