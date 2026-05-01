import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { fetchAnimeById } from "@/lib/api/anime"
import { getAnimeUrlFromIdAndTitle, titleToSlug } from "@/lib/utils/anime-urls"
import { sanitizeHtml } from "@/lib/utils/text"
import { Footer } from "@/components/layout/footer"
import { AnimeHero } from "@/components/anime/anime-hero"
import { AnimeSidebar } from "@/components/anime/anime-sidebar"
import { AnimeTabs } from "@/components/anime/anime-tabs"
import AnimeNotFound from "@/components/anime/anime-not-found"
import type { AnimeData } from "@/lib/types/anime"

// Force dynamic rendering to handle redirects on each request
export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ id: string; title: string }>
}

/**
 * Fetch anime data from API (with Redis cache on backend)
 */
async function getAnime(id: string): Promise<AnimeData | null> {
  const animeId = parseInt(id, 10)
  if (isNaN(animeId)) {
    return null
  }
  return await fetchAnimeById(animeId)
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const anime = await getAnime(id)

  if (!anime) {
    return { title: "Not Found — AnimeVault" }
  }

  const cleanSynopsis = sanitizeHtml(anime.synopsis)
  return {
    title: `${anime.title} — AnimeVault`,
    description: cleanSynopsis.slice(0, 155) + "…",
    openGraph: {
      title: `${anime.title} — AnimeVault`,
      description: anime.synopsis.slice(0, 155) + "…",
      images: [{ url: anime.banner }],
      type: "website",
    },
  }
}

export default async function AnimePage({ params }: PageProps) {
  const { id, title } = await params
  const anime = await getAnime(id)

  if (!anime) {
    // Show friendly error page if anime doesn't exist
    return <AnimeNotFound id={id} />
  }

  // Validate and redirect to canonical URL if title doesn't match
  // Normalize both slugs for comparison
  const correctSlug = titleToSlug(anime.title)
  const providedSlug = titleToSlug(title)
  
  if (correctSlug !== providedSlug) {
    // Redirect to canonical URL with correct slug
    redirect(getAnimeUrlFromIdAndTitle(anime.id, anime.title))
  }

  return (
    <div className="min-h-screen bg-background text-foreground">

      <main>
        {/* Hero (banner + poster + title + actions) */}
        <AnimeHero anime={anime} />

        {/* Body */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 xl:gap-12">
            {/* Main content with tabs */}
            <div>
              <AnimeTabs anime={anime} />
            </div>

            {/* Sidebar */}
            <AnimeSidebar anime={anime} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
