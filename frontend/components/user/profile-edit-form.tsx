"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
} from "@/components/ui/field"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Upload, X, Camera, Loader2 } from "lucide-react"
import type { UserProfile, UpdateUserProfileRequest } from "@/lib/types/user"
import { cn } from "@/lib/utils"

interface ProfileEditFormProps {
  profile: UserProfile
  onUpdate: (data: UpdateUserProfileRequest) => Promise<void>
  trigger?: React.ReactNode
}

const timezones = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Montevideo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
]

export function ProfileEditForm({ profile, onUpdate, trigger }: ProfileEditFormProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    profile.avatar || null
  )
  const [bannerPreview, setBannerPreview] = useState<string | null>(
    profile.banner || null
  )
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [removeAvatar, setRemoveAvatar] = useState(false)
  const [removeBanner, setRemoveBanner] = useState(false)

  // Form state
  const [aboutMe, setAboutMe] = useState(profile.about_me || "")
  const [timezone, setTimezone] = useState(profile.timezone || "")
  const [isProfilePublic, setIsProfilePublic] = useState(profile.is_profile_public)
  const [preferredTitleLanguage, setPreferredTitleLanguage] = useState(
    profile.preferred_title_language || "romaji"
  )
  const [preferredScoringSystem, setPreferredScoringSystem] = useState(
    profile.preferred_scoring_system || "point_10"
  )

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      setRemoveAvatar(false)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setBannerFile(file)
      setRemoveBanner(false)
      const reader = new FileReader()
      reader.onloadend = () => {
        setBannerPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
    setRemoveAvatar(true)
  }

  const handleRemoveBanner = () => {
    setBannerFile(null)
    setBannerPreview(null)
    setRemoveBanner(true)
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onUpdate({
        about_me: aboutMe,
        timezone,
        is_profile_public: isProfilePublic,
        preferred_title_language: preferredTitleLanguage,
        preferred_scoring_system: preferredScoringSystem,
        avatar: avatarFile || undefined,
        banner: bannerFile || undefined,
        remove_avatar: removeAvatar || undefined,
        remove_banner: removeBanner || undefined,
      })
      setOpen(false)
    } catch (error) {
      console.error("Failed to update profile:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const initials = profile.username
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Camera className="h-4 w-4" />
            Edit Profile
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your profile information and preferences
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Avatar */}
          <div className="space-y-2">
            <FieldLabel>Avatar</FieldLabel>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarPreview || undefined} />
                <AvatarFallback className="bg-emerald-600 text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex gap-2">
                <label htmlFor="avatar-upload">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Upload
                  </Button>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </label>
                {avatarPreview && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveAvatar}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Banner */}
          <div className="space-y-2">
            <FieldLabel>Banner</FieldLabel>
            <div className="relative h-32 w-full overflow-hidden rounded-lg border border-dashed">
              {bannerPreview ? (
                <img
                  src={bannerPreview}
                  alt="Banner preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted">
                  <span className="text-sm text-muted-foreground">
                    No banner uploaded
                  </span>
                </div>
              )}
              <div className="absolute right-2 top-2 flex gap-2">
                <label htmlFor="banner-upload">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="gap-2 cursor-pointer"
                    asChild
                  >
                    <span>
                      <Upload className="h-4 w-4" />
                      Upload
                    </span>
                  </Button>
                  <input
                    id="banner-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleBannerChange}
                  />
                </label>
                {bannerPreview && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleRemoveBanner}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* About Me */}
          <FieldGroup>
            <FieldLabel htmlFor="about-me">About Me</FieldLabel>
            <Textarea
              id="about-me"
              placeholder="Tell us about yourself..."
              className="min-h-[100px]"
              value={aboutMe}
              onChange={(e) => setAboutMe(e.target.value)}
              maxLength={1000}
            />
            <FieldDescription>Maximum 1000 characters</FieldDescription>
          </FieldGroup>

          {/* Timezone */}
          <FieldGroup>
            <FieldLabel htmlFor="timezone">Timezone</FieldLabel>
            <Select
              value={timezone}
              onValueChange={(value) => setTimezone(value || "")}
            >
              <SelectTrigger id="timezone">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {timezones.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldGroup>

          {/* Profile Visibility */}
          <div className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FieldLabel>Public Profile</FieldLabel>
              <FieldDescription>
                Make your profile visible to other users
              </FieldDescription>
            </div>
            <Switch
              checked={isProfilePublic}
              onCheckedChange={setIsProfilePublic}
            />
          </div>

          {/* Preferred Title Language */}
          <FieldGroup>
            <FieldLabel htmlFor="title-language">Preferred Title Language</FieldLabel>
            <Select
              value={preferredTitleLanguage}
              onValueChange={(value) => setPreferredTitleLanguage(value as "romaji" | "english" | "native")}
            >
              <SelectTrigger id="title-language">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="romaji">Romaji</SelectItem>
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="native">Native</SelectItem>
              </SelectContent>
            </Select>
            <FieldDescription>
              Choose how anime titles are displayed
            </FieldDescription>
          </FieldGroup>

          {/* Preferred Scoring System */}
          <FieldGroup>
            <FieldLabel htmlFor="scoring-system">Scoring System</FieldLabel>
            <Select
              value={preferredScoringSystem}
              onValueChange={(value) => setPreferredScoringSystem(value as "point_100" | "point_10_decimal" | "point_10" | "star_5")}
            >
              <SelectTrigger id="scoring-system">
                <SelectValue placeholder="Select scoring system" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="point_100">100 Point</SelectItem>
                <SelectItem value="point_10_decimal">10 Point (Decimal)</SelectItem>
                <SelectItem value="point_10">10 Point</SelectItem>
                <SelectItem value="star_5">5 Star</SelectItem>
              </SelectContent>
            </Select>
            <FieldDescription>Choose how you rate anime</FieldDescription>
          </FieldGroup>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}