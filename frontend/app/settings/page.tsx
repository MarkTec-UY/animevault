import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { SettingsForm } from "@/components/settings/settings-form"
import { SettingsSecurity } from "@/components/settings/settings-security"
import { getOwnProfile } from "@/lib/server/profile-data"

export const metadata: Metadata = {
  title: "Settings — AnimeVault",
  description:
    "Update your AnimeVault profile, preferences, and privacy settings.",
}

export default async function SettingsPage() {
  const user = await getOwnProfile()

  if (!user) {
    redirect("/login?redirect=/settings")
  }

  return (
    <main className="min-h-screen bg-background pb-24 pt-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Link
          href={`/user/${user.username}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to profile
        </Link>

        <header className="mt-4 mb-8">
          <h1 className="font-serif text-4xl text-foreground">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your profile, preferences, and account details.
          </p>
        </header>

        <div className="space-y-10">
          <SettingsForm user={user} />
          <SettingsSecurity user={user} />
        </div>
      </div>
    </main>
  )
}
