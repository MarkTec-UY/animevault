"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Shield, Edit } from "lucide-react"
import type { UserProfile } from "@/lib/types/user"
import { cn } from "@/lib/utils"

interface ProfileHeaderProps {
  profile: UserProfile
  isOwnProfile?: boolean
  onEditClick?: () => void
}

export function ProfileHeader({
  profile,
  isOwnProfile = false,
  onEditClick,
}: ProfileHeaderProps) {
  const initials = profile.username
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    })
  }

  return (
    <div className="relative">
      {/* Banner */}
      <div
        className={cn(
          "h-48 w-full bg-gradient-to-r from-slate-900 to-slate-800",
          !profile.banner && "bg-gradient-to-r from-emerald-900 to-slate-900"
        )}
      >
        {profile.banner && (
          <img
            src={profile.banner}
            alt="Banner"
            className="h-full w-full object-cover"
          />
        )}
      </div>

      {/* Profile Content */}
      <div className="container mx-auto px-4 pb-8">
        <div className="-mt-16 flex items-end gap-6">
          {/* Avatar */}
          <Avatar className="h-32 w-32 border-4 border-background">
            <AvatarImage src={profile.avatar || undefined} alt={profile.username} />
            <AvatarFallback className="bg-emerald-600 text-2xl font-bold text-white">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* User Info */}
          <div className="flex-1 pb-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-foreground">
                {profile.username}
              </h1>
              {isOwnProfile && (
                <Badge variant="outline" className="gap-1">
                  <Shield className="h-3 w-3" />
                  You
                </Badge>
              )}
              {!profile.is_profile_public && (
                <Badge variant="secondary">Private</Badge>
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Joined {formatDate(profile.created_at)}</span>
              </div>
              {profile.timezone && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{profile.timezone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Edit Button */}
          {isOwnProfile && onEditClick && (
            <Button onClick={onEditClick} variant="outline" className="gap-2">
              <Edit className="h-4 w-4" />
              Edit Profile
            </Button>
          )}
        </div>

        {/* About Me */}
        {profile.about_me && (
          <div className="mt-6 rounded-lg border bg-card p-4">
            <h3 className="mb-2 font-semibold text-foreground">About Me</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {profile.about_me}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}