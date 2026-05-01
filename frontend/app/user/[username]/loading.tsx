import { Skeleton } from "@/components/ui/skeleton"

export default function UserProfileLoading() {
  return (
    <main className="min-h-screen bg-background pb-16 pt-16">
      <Skeleton className="h-48 w-full rounded-none sm:h-64 lg:h-80" />

      <div className="mx-auto -mt-20 max-w-6xl px-4 sm:-mt-24 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
          <Skeleton className="h-32 w-32 rounded-full border-4 border-background sm:h-40 sm:w-40" />
          <div className="flex-1 space-y-3 pb-2">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-4 w-32" />
            <div className="flex gap-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-6xl space-y-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>

        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[2/3] rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
