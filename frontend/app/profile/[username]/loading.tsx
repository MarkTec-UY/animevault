import { Skeleton } from "@/components/ui/skeleton"

export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Banner Skeleton */}
      <div className="h-48 w-full bg-gradient-to-r from-slate-900 to-slate-800" />

      <div className="container mx-auto px-4 pb-8">
        <div className="-mt-16 flex items-end gap-6">
          {/* Avatar Skeleton */}
          <Skeleton className="h-32 w-32 rounded-full border-4 border-background" />

          {/* User Info Skeleton */}
          <div className="flex-1 space-y-2 pb-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>

          {/* Edit Button Skeleton */}
          <Skeleton className="h-10 w-24" />
        </div>

        {/* About Me Skeleton */}
        <div className="mt-6 rounded-lg border bg-card p-4">
          <Skeleton className="mb-2 h-5 w-24" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>

      {/* Stats Skeleton */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-4">
              <Skeleton className="mb-2 h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
      </div>

      {/* Library Skeleton */}
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="mb-4 h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-4">
              <Skeleton className="mb-3 h-40 w-full" />
              <Skeleton className="mb-2 h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}