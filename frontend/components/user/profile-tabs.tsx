"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LibraryGrid } from "./library-grid"
import { FavoritesGrid } from "./favorites-grid"
import type { LibraryEntry, FavoriteAnime } from "@/lib/types/user"

interface ProfileTabsProps {
  library: LibraryEntry[]
  favorites: FavoriteAnime[]
  loading?: boolean
}

export function ProfileTabs({
  library,
  favorites,
  loading,
}: ProfileTabsProps) {
  return (
    <Tabs defaultValue="library" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="library">Library</TabsTrigger>
        <TabsTrigger value="favorites">Favorites</TabsTrigger>
      </TabsList>

      <TabsContent value="library" className="mt-6">
        <LibraryGrid entries={library} loading={loading} />
      </TabsContent>

      <TabsContent value="favorites" className="mt-6">
        <FavoritesGrid favorites={favorites} loading={loading} />
      </TabsContent>
    </Tabs>
  )
}