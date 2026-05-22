"use client"

import Link from "next/link"
import { ChevronRight, TrendingUp, Star, Clock, Sparkles, Crown, BookOpen } from "lucide-react"
import { motion } from "motion/react"
import { useQuery } from "@tanstack/react-query"

import { MangaCard } from "@/components/manga/manga-card"
import { searchManga } from "@/lib/api/search"
import { transformApiResponseToMangaData } from "@/lib/api/manga"
import type { MangaData } from "@/lib/types/manga"

interface CategorySectionProps {
  title: string
  subtitle?: string
  icon: React.ReactNode
  viewAllHref?: string
  filters: Record<string, unknown>
  limit?: number
}

function CategoryCardSkeleton() {
  return (
    <div className="space-y-3">
      <div className="aspect-[2/3] rounded-xl bg-secondary/40 animate-pulse relative overflow-hidden border border-border/30">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
      </div>
      <div className="space-y-2 px-1">
        <div className="h-4 w-full bg-secondary/40 animate-pulse rounded-md" />
        <div className="h-3 w-2/3 bg-secondary/40 animate-pulse rounded-md" />
      </div>
    </div>
  )
}

export function MangaCategorySection({ 
  title, 
  subtitle, 
  icon, 
  viewAllHref, 
  filters,
  limit = 6 
}: CategorySectionProps) {
  const { data: mangas, isLoading, isError } = useQuery<MangaData[]>({
    queryKey: ["manga", "category", title, filters, limit],
    queryFn: async () => {
      const response = await searchManga({ ...filters, per_page: limit } as Record<string, unknown>, limit)
      return response.data.map((item) => transformApiResponseToMangaData(item))
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  if (isError) return null

  return (
    <section className="py-8">
      <div className="flex items-end justify-between mb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            {icon}
            <span>{subtitle}</span>
          </div>
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
            {title}
          </h2>
        </div>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            View all <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
          {Array.from({ length: limit }).map((_, i) => (
            <CategoryCardSkeleton key={i} />
          ))}
        </div>
      ) : mangas && mangas.length > 0 ? (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.05 } }
          }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6"
        >
          {mangas.map((manga, index) => (
            <motion.div
              key={manga.id}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <MangaCard manga={manga} showHoverCard={true} />
            </motion.div>
          ))}
        </motion.div>
      ) : null}
    </section>
  )
}

// Pre-configured category sections
export function TrendingMangaSection() {
  return (
    <MangaCategorySection
      title="Trending Now"
      subtitle="Right now"
      icon={<TrendingUp className="h-4 w-4" />}
      viewAllHref="/manga?sort=trending_desc"
      filters={{ sort: "trending_desc" }}
      limit={6}
    />
  )
}

export function TopRatedMangaSection() {
  return (
    <MangaCategorySection
      title="Top Rated All Time"
      subtitle="Best of the best"
      icon={<Crown className="h-4 w-4" />}
      viewAllHref="/manga?sort=score_desc"
      filters={{ sort: "score_desc" }}
      limit={6}
    />
  )
}

export function MostPopularMangaSection() {
  return (
    <MangaCategorySection
      title="Most Popular"
      subtitle="Fan favorites"
      icon={<Star className="h-4 w-4" />}
      viewAllHref="/manga?sort=popularity_desc"
      filters={{ sort: "popularity_desc" }}
      limit={6}
    />
  )
}

export function OngoingMangaSection() {
  return (
    <MangaCategorySection
      title="Currently Publishing"
      subtitle="Read now"
      icon={<Sparkles className="h-4 w-4" />}
      viewAllHref="/manga?status=RELEASING&sort=popularity_desc"
      filters={{ status: ["RELEASING"], sort: "popularity_desc" }}
      limit={6}
    />
  )
}

export function NewMangaSection() {
  return (
    <MangaCategorySection
      title="New Releases"
      subtitle="Fresh picks"
      icon={<BookOpen className="h-4 w-4" />}
      viewAllHref="/manga?sort=start_date_desc"
      filters={{ sort: "start_date_desc" }}
      limit={6}
    />
  )
}

// Combined default sections component
export function MangaDefaultSections() {
  return (
    <div className="space-y-8">
      <TrendingMangaSection />
      <OngoingMangaSection />
      <TopRatedMangaSection />
      <MostPopularMangaSection />
      <NewMangaSection />
    </div>
  )
}
