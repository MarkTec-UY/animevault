"use client"

import { useMemo, useState } from "react"
import { Library } from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { LibraryItem, LibraryStatus } from "@/lib/types/profile"

import { LibraryAnimeCard } from "./library-anime-card"

interface ProfileLibraryProps {
  library: LibraryItem[]
  ownerName: string
}

const STATUS_TABS: { key: LibraryStatus; label: string }[] = [
  { key: "watching", label: "Watching" },
  { key: "completed", label: "Completed" },
  { key: "paused", label: "Paused" },
  { key: "dropped", label: "Dropped" },
  { key: "planning", label: "Planning" },
]

function EmptyState({ status }: { status: LibraryStatus }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
        <Library className="h-5 w-5" />
      </div>
      <p className="text-sm font-medium text-foreground">
        Nothing here yet
      </p>
      <p className="mt-1 max-w-sm text-xs text-muted-foreground">
        No anime in the {status} list.
      </p>
    </div>
  )
}

export function ProfileLibrary({ library, ownerName }: ProfileLibraryProps) {
  const [active, setActive] = useState<LibraryStatus>("watching")

  const grouped = useMemo(() => {
    const map: Record<LibraryStatus, LibraryItem[]> = {
      watching: [],
      completed: [],
      paused: [],
      dropped: [],
      planning: [],
    }
    for (const item of library) {
      if (map[item.status]) map[item.status].push(item)
    }
    return map
  }, [library])

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl text-foreground">
            {ownerName}&apos;s anime
          </h2>
          <p className="text-sm text-muted-foreground">
            {library.length} entries across all lists
          </p>
        </div>
      </div>

      <Tabs
        value={active}
        onValueChange={(v) => setActive(v as LibraryStatus)}
      >
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-secondary/60 p-1">
          {STATUS_TABS.map(({ key, label }) => (
            <TabsTrigger
              key={key}
              value={key}
              className="data-[state=active]:bg-card data-[state=active]:text-foreground"
            >
              {label}
              <span className="ml-1.5 rounded-full bg-background/60 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                {grouped[key].length}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {STATUS_TABS.map(({ key }) => (
          <TabsContent key={key} value={key} className="mt-6">
            {grouped[key].length === 0 ? (
              <EmptyState status={key} />
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {grouped[key].map((item) => (
                  <LibraryAnimeCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </section>
  )
}
