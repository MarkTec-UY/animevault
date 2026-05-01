"use client"

import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import Link from "next/link"
import { Film, Star, Pencil } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { LibraryItem, LibraryStatus } from "@/lib/types/profile"
import { LibraryEditModal } from "./library-edit-modal"

interface ProfileLibraryProps {
  library: LibraryItem[]
  ownerName: string
}

const STATUS_CONFIG: Record<LibraryStatus, { label: string; color: string }> = {
  watching: { label: "Watching", color: "text-emerald-500" },
  completed: { label: "Completed", color: "text-blue-500" },
  paused: { label: "Paused", color: "text-amber-500" },
  dropped: { label: "Dropped", color: "text-red-500" },
  planning: { label: "Plan to Watch", color: "text-purple-500" },
}

function progressPercent(item: LibraryItem): number {
  const total = item.anime.episodes ?? 0
  if (!total || total <= 0) return 0
  const pct = (item.progress_episodes / total) * 100
  return Math.min(100, Math.max(0, pct))
}

function LibraryItemRow({ 
  item, 
  onEdit 
}: { 
  item: LibraryItem
  onEdit: (item: LibraryItem) => void
}) {
  const pct = progressPercent(item)
  const totalEpisodes = item.anime.episodes ?? null

  return (
    <div className="group flex items-center gap-4 rounded-lg border border-transparent bg-card p-2 transition-all hover:border-border hover:bg-card/80">
      <Link href={`/anime/${item.anime.id}`} className="shrink-0">
        <div className="relative overflow-hidden rounded-md">
          {item.anime.cover_image_large ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.anime.cover_image_large}
              alt={item.anime.title}
              className="h-16 w-12 object-cover"
            />
          ) : (
            <div className="flex h-16 w-12 items-center justify-center bg-secondary text-xs text-muted-foreground">
              N/A
            </div>
          )}
          {item.score != null && item.score > 0 && (
            <div className="absolute -right-1 -top-1 flex items-center gap-0.5 rounded-full bg-background/90 px-1.5 py-0.5 text-[10px] font-semibold text-foreground shadow-sm backdrop-blur">
              <Star className="h-2.5 w-2.5 fill-accent text-accent" />
              {item.score}
            </div>
          )}
        </div>
      </Link>

      <Link href={`/anime/${item.anime.id}`} className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <h3 className="truncate text-sm font-medium text-foreground group-hover:text-primary">
          {item.anime.title}
        </h3>
        
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {totalEpisodes && (
            <span>
              {item.progress_episodes}/{totalEpisodes} ep
            </span>
          )}
          {pct > 0 && (
            <>
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="shrink-0 font-medium">{Math.round(pct)}%</span>
            </>
          )}
          {!totalEpisodes && (
            <span className="text-muted-foreground/60">No episodes</span>
          )}
        </div>
      </Link>

      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.preventDefault()
          onEdit(item)
        }}
      >
        <Pencil className="h-4 w-4" />
      </Button>
    </div>
  )
}

function StatusSection({ 
  status, 
  items,
  onEdit
}: { 
  status: LibraryStatus
  items: LibraryItem[]
  onEdit: (item: LibraryItem) => void
}) {
  if (items.length === 0) return null
  
  const config = STATUS_CONFIG[status]
  
  return (
    <section className="space-y-3">
      <h3 className={`flex items-center gap-2 text-lg font-semibold ${config.color}`}>
        {config.label}
        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {items.length}
        </span>
      </h3>
      
      <div className="flex flex-col gap-1">
        {items.map((item) => (
          <LibraryItemRow key={item.anime_id || item.id} item={item} onEdit={onEdit} />
        ))}
      </div>
    </section>
  )
}

export function ProfileLibrary({ library, ownerName }: ProfileLibraryProps) {
  const router = useRouter()
  const [editingItem, setEditingItem] = useState<LibraryItem | null>(null)

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

  const hasAnyItems = library.length > 0

  function handleEdit(item: LibraryItem) {
    setEditingItem(item)
  }

  function handleUpdate() {
    router.refresh()
    setEditingItem(null)
  }

  return (
    <section className="space-y-8">
      <div className="flex items-end justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="flex items-center gap-2 font-serif text-2xl font-bold text-foreground">
            <Film className="h-6 w-6 text-primary" />
            {ownerName}&apos;s Anime List
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {library.length} {library.length === 1 ? 'entry' : 'entries'} across all lists
          </p>
        </div>
      </div>

      {!hasAnyItems ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/50 bg-card/30 px-6 py-16 text-center">
          <p className="text-lg font-medium text-foreground">
            No anime in your list yet
          </p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Start tracking your anime journey by adding some to your list.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          <StatusSection status="watching" items={grouped.watching} onEdit={handleEdit} />
          <StatusSection status="completed" items={grouped.completed} onEdit={handleEdit} />
          <StatusSection status="paused" items={grouped.paused} onEdit={handleEdit} />
          <StatusSection status="dropped" items={grouped.dropped} onEdit={handleEdit} />
          <StatusSection status="planning" items={grouped.planning} onEdit={handleEdit} />
        </div>
      )}

      {editingItem && (
        <LibraryEditModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onUpdate={handleUpdate}
        />
      )}
    </section>
  )
}
