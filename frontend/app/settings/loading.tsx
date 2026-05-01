import { Skeleton } from "@/components/ui/skeleton"

export default function SettingsLoading() {
  return (
    <main className="min-h-screen bg-background pb-24 pt-24">
      <div className="mx-auto max-w-3xl space-y-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-44 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>
    </main>
  )
}
