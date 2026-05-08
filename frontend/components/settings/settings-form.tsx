"use client"

import { useRef, useState, type ChangeEvent, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  CheckCircle2,
  ImagePlus,
  Loader2,
  Trash2,
  UserRound,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { getCsrfTokenFromDocument } from "@/lib/csrf"
import type {
  ProfileUser,
  ScoringSystem,
  TitleLanguage,
} from "@/lib/types/profile"
import {
  DEFAULT_AVATAR,
  getInitials,
  resolveAvatarUrl,
  resolveBannerUrl,
} from "@/components/user/avatar-utils"

interface SettingsFormProps {
  user: ProfileUser
}

const TITLE_LANGUAGES: { value: TitleLanguage; label: string }[] = [
  { value: "romaji", label: "Romaji" },
  { value: "english", label: "English" },
  { value: "native", label: "Native (Japanese)" },
]

const SCORING_SYSTEMS: { value: ScoringSystem; label: string }[] = [
  { value: "point_100", label: "100 Points (e.g. 87)" },
  { value: "point_10_decimal", label: "10 Points decimal (e.g. 8.5)" },
  { value: "point_10", label: "10 Points (e.g. 8)" },
  { value: "star_5", label: "5 Stars" },
]

const COMMON_TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Los_Angeles",
  "America/Mexico_City",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Madrid",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Asia/Shanghai",
  "Australia/Sydney",
]

interface ImageState {
  file: File | null
  preview: string | null
  remove: boolean
}

const initialImage = (preview: string | null): ImageState => ({
  file: null,
  preview,
  remove: false,
})

export function SettingsForm({ user }: SettingsFormProps) {
  const router = useRouter()
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(user.name ?? "")
  const [aboutMe, setAboutMe] = useState(user.about_me ?? "")
  const [timezone, setTimezone] = useState(user.timezone ?? "UTC")
  const [titleLanguage, setTitleLanguage] = useState<TitleLanguage>(
    user.preferred_title_language
  )
  const [scoringSystem, setScoringSystem] = useState<ScoringSystem>(
    user.preferred_scoring_system
  )
  const [isPublic, setIsPublic] = useState(user.is_profile_public)

  const [avatar, setAvatar] = useState<ImageState>(
    initialImage(resolveAvatarUrl(user))
  )
  const [banner, setBanner] = useState<ImageState>(
    initialImage(resolveBannerUrl(user))
  )

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  const handleImageChange =
    (setter: (s: ImageState) => void) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] ?? null
      if (!file) return

      if (file.size > 5 * 1024 * 1024) {
        setError("Images must be smaller than 5 MB.")
        return
      }
      if (!file.type.startsWith("image/")) {
        setError("Only image files are supported.")
        return
      }

      const reader = new FileReader()
      reader.onload = () =>
        setter({
          file,
          preview: typeof reader.result === "string" ? reader.result : null,
          remove: false,
        })
      reader.readAsDataURL(file)
    }

  const handleRemove =
    (setter: (s: ImageState) => void) =>
    () =>
      setter({ file: null, preview: null, remove: true })

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    setFieldErrors({})
    setSubmitting(true)

    try {
      const csrfToken = await getCsrfTokenFromDocument()

      const formData = new FormData()
      formData.append("name", name.trim())
      formData.append("about_me", aboutMe)
      formData.append("timezone", timezone)
      formData.append("preferred_title_language", titleLanguage)
      formData.append("preferred_scoring_system", scoringSystem)
      formData.append("is_profile_public", isPublic ? "1" : "0")

      if (avatar.file) formData.append("avatar", avatar.file)
      if (avatar.remove) formData.append("remove_avatar", "1")
      if (banner.file) formData.append("banner", banner.file)
      if (banner.remove) formData.append("remove_banner", "1")

      // Laravel doesn't parse FormData on PUT; spoof method.
      formData.append("_method", "PUT")

      const response = await fetch("/auth/profile", {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "X-XSRF-TOKEN": csrfToken,
          "X-Requested-With": "XMLHttpRequest",
        },
        body: formData,
      })

      if (!response.ok) {
        if (response.status === 422) {
          const data = await response.json().catch(() => ({}))
          setFieldErrors(data?.errors ?? {})
          throw new Error(data?.message ?? "Some fields are invalid.")
        }
        throw new Error(`Failed to save (${response.status})`)
      }

      setSuccess("Your settings have been saved.")
      // Reset image staging state and refresh server-rendered nav/profile.
      setAvatar((prev) => ({ ...prev, file: null, remove: false }))
      setBanner((prev) => ({ ...prev, file: null, remove: false }))
      router.refresh()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while saving your settings."
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Status messages */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}
      {success && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm text-primary"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{success}</p>
        </div>
      )}

      {/* Banner upload */}
      <section className="space-y-3">
        <div>
          <h3 className="font-serif text-xl text-foreground">Banner</h3>
          <p className="text-xs text-muted-foreground">
            Wide image shown at the top of your profile. Recommended 1500×400.
          </p>
        </div>
        <div className="relative h-40 w-full overflow-hidden rounded-xl border border-border bg-secondary sm:h-52">
          {banner.preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={banner.preview}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 via-secondary to-accent/20 text-xs text-muted-foreground">
              No banner
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange(setBanner)}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => bannerInputRef.current?.click()}
          >
            <ImagePlus className="mr-1.5 h-4 w-4" />
            {banner.preview ? "Replace banner" : "Upload banner"}
          </Button>
          {banner.preview && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove(setBanner)}
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Remove
            </Button>
          )}
        </div>
        {fieldErrors.banner?.[0] && (
          <p className="text-xs text-destructive">{fieldErrors.banner[0]}</p>
        )}
      </section>

      {/* Avatar upload */}
      <section className="space-y-3">
        <div>
          <h3 className="font-serif text-xl text-foreground">Avatar</h3>
          <p className="text-xs text-muted-foreground">
            Square image used everywhere your profile appears.
          </p>
        </div>
        <div className="flex items-center gap-5">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-border bg-secondary">
            {avatar.preview && avatar.preview !== DEFAULT_AVATAR ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar.preview}
                alt={user.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-primary text-xl font-semibold text-primary-foreground">
                {user.name ? (
                  getInitials(user.name)
                ) : (
                  <UserRound className="h-8 w-8" />
                )}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange(setAvatar)}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => avatarInputRef.current?.click()}
            >
              <ImagePlus className="mr-1.5 h-4 w-4" />
              {avatar.preview ? "Change avatar" : "Upload avatar"}
            </Button>
            {avatar.preview && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove(setAvatar)}
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                Remove
              </Button>
            )}
          </div>
        </div>
        {fieldErrors.avatar?.[0] && (
          <p className="text-xs text-destructive">{fieldErrors.avatar[0]}</p>
        )}
      </section>

      {/* Identity */}
      <section className="space-y-4 rounded-xl border border-border bg-card p-6">
        <div>
          <h3 className="font-serif text-xl text-foreground">
            Public details
          </h3>
          <p className="text-xs text-muted-foreground">
            How other AnimeVault users see you.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Display name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={60}
            aria-invalid={Boolean(fieldErrors.name)}
          />
          {fieldErrors.name?.[0] && (
            <p className="text-xs text-destructive">{fieldErrors.name[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="about_me">About me</Label>
          <Textarea
            id="about_me"
            rows={5}
            value={aboutMe}
            maxLength={500}
            onChange={(e) => setAboutMe(e.target.value)}
            placeholder="Tell other otaku about yourself…"
            aria-invalid={Boolean(fieldErrors.about_me)}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {fieldErrors.about_me?.[0] ? (
                <span className="text-destructive">
                  {fieldErrors.about_me[0]}
                </span>
              ) : (
                "Markdown is not supported."
              )}
            </span>
            <span>{aboutMe.length}/500</span>
          </div>
        </div>
      </section>

      {/* Preferences */}
      <section className="space-y-5 rounded-xl border border-border bg-card p-6">
        <div>
          <h3 className="font-serif text-xl text-foreground">Preferences</h3>
          <p className="text-xs text-muted-foreground">
            Personalize how anime data is presented to you.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger id="timezone">
                <SelectValue placeholder="Select a timezone" />
              </SelectTrigger>
              <SelectContent>
                {COMMON_TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title_language">Preferred title language</Label>
            <Select
              value={titleLanguage}
              onValueChange={(v) => setTitleLanguage(v as TitleLanguage)}
            >
              <SelectTrigger id="title_language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TITLE_LANGUAGES.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="scoring_system">Scoring system</Label>
            <Select
              value={scoringSystem}
              onValueChange={(v) => setScoringSystem(v as ScoringSystem)}
            >
              <SelectTrigger id="scoring_system">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCORING_SYSTEMS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-background/40 p-4">
          <div>
            <p className="text-sm font-medium text-foreground">
              Public profile
            </p>
            <p className="text-xs text-muted-foreground">
              When off, your library, favorites, and stats are hidden from
              other users.
            </p>
          </div>
          <Checkbox
            checked={isPublic}
            onCheckedChange={(checked) => setIsPublic(checked === true)}
          />
        </div>
      </section>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
          {submitting ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  )
}
