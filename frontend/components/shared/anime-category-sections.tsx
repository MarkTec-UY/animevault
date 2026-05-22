"use client"

import Link from "next/link"
import { ChevronRight, TrendingUp, Star, Clock, Sparkles, Crown } from "lucide-react"
import { motion } from "motion/react"
import { useQuery } from "@tanstack/react-query"

import { AnimeCard } from "@/components/anime/anime-card"
import { Skeleton } from "@/components/ui/skeleton"
import { searchAnime } from "@/lib/api/search"
import { transformApiResponseToAnimeData } from "@/lib/api/anime"
import type { AnimeData } from "@/lib/types/anime"

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

export function AnimeCategorySection({ 
  title, 
  subtitle, 
  icon, 
  viewAllHref, 
  filters,
  limit = 6 
}: CategorySectionProps) {
  const { data: animes, isLoading, isError } = useQuery<AnimeData[]>({
    queryKey: ["anime", "category", title, filters, limit],
    queryFn: async () => {
      const response = await searchAnime({ ...filters, per_page: limit } as Record<string, unknown>, limit)
      return response.data.map((item) => transformApiResponseToAnimeData(item))
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
      ) : animes && animes.length > 0 ? (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.05 } }
          }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6"
        >
          {animes.map((anime, index) => (
            <motion.div
              key={anime.id}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <AnimeCard anime={anime} showHoverCard={true} />
            </motion.div>
          ))}
        </motion.div>
      ) : null}
    </section>
  )
}

// Pre-configured category sections
export function TrendingNowSection() {
  return (
    <AnimeCategorySection
      title="Trending Now"
      subtitle="Right now"
      icon={<TrendingUp className="h-4 w-4" />}
      viewAllHref="/anime?sort=trending_desc"
      filters={{ sort: "trending_desc" }}
      limit={6}
    />
  )
}

export function TopRatedAllTimeSection() {
  return (
    <AnimeCategorySection
      title="Top Rated All Time"
      subtitle="Best of the best"
      icon={<Crown className="h-4 w-4" />}
      viewAllHref="/anime?sort=score_desc"
      filters={{ sort: "score_desc" }}
      limit={6}
    />
  )
}

export function MostPopularSection() {
  return (
    <AnimeCategorySection
      title="Most Popular"
      subtitle="Fan favorites"
      icon={<Star className="h-4 w-4" />}
      viewAllHref="/anime?sort=popularity_desc"
      filters={{ sort: "popularity_desc" }}
      limit={6}
    />
  )
}

export function UpcomingAnimeSection() {
  return (
    <AnimeCategorySection
      title="Upcoming Releases"
      subtitle="Coming soon"
      icon={<Clock className="h-4 w-4" />}
      viewAllHref="/anime?status=NOT_YET_RELEASED&sort=popularity_desc"
      filters={{ status: ["NOT_YET_RELEASED"], sort: "popularity_desc" }}
      limit={6}
    />
  )
}

export function CurrentlyAiringSection() {
  return (
    <AnimeCategorySection
      title="Currently Airing"
      subtitle="Watch now"
      icon={<Sparkles className="h-4 w-4" />}
      viewAllHref="/anime?status=RELEASING&sort=popularity_desc"
      filters={{ status: ["RELEASING"], sort: "popularity_desc" }}
      limit={6}
    />
  )
}

// Combined default sections component
export function AnimeDefaultSections() {
  return (
    <div className="space-y-8">
      <TrendingNowSection />
      <CurrentlyAiringSection />
      <TopRatedAllTimeSection />
      <MostPopularSection />
      <UpcomingAnimeSection />
    </div>
  )
}
