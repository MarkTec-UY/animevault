import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { fetchMangaById } from "@/lib/api/manga"
import { getMangaUrlFromIdAndTitle } from "@/lib/utils/manga-urls"
import { titleToSlug } from "@/lib/utils/anime-urls"
import { sanitizeHtml } from "@/lib/utils/text"
import { Footer } from "@/components/layout/footer"
import { MangaHero } from "@/components/manga/manga-hero"
import { MangaSidebar } from "@/components/manga/manga-sidebar"
import { MangaTabs } from "@/components/manga/manga-tabs"
import MangaNotFound from "@/components/manga/manga-not-found"
import type { MangaData } from "@/lib/types/manga"

// Force dynamic rendering to handle redirects on each request
export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ id: string; title: string }>
}

/**
 * Fetch manga data from API
 */
async function getManga(id: string): Promise<MangaData | null> {
  return getMangaWithOptions(id)
}

async function getMangaWithOptions(
  id: string,
  options?: { includeExtras?: boolean },
): Promise<MangaData | null> {
  const mangaId = parseInt(id, 10)
  if (isNaN(mangaId)) {
    return null
  }
  return await fetchMangaById(mangaId, options)
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const manga = await getMangaWithOptions(id, { includeExtras: false })

  if (!manga) {
    return { title: "Not Found — AnimeVault" }
  }

  const cleanSynopsis = sanitizeHtml(manga.synopsis)
  return {
    title: `${manga.title} — AnimeVault`,
    description: cleanSynopsis.slice(0, 155) + "…",
    openGraph: {
      title: `${manga.title} — AnimeVault`,
      description: manga.synopsis.slice(0, 155) + "…",
      images: [{ url: manga.banner }],
      type: "website",
    },
  }
}

export default async function MangaPage({ params }: PageProps) {
  const { id, title } = await params
  const manga = await getManga(id)

  if (!manga) {
    return <MangaNotFound id={id} />
  }

  // Validate and redirect to canonical URL if title doesn't match
  const correctSlug = titleToSlug(manga.title)
  const providedSlug = titleToSlug(title)
  
  if (correctSlug !== providedSlug) {
    redirect(getMangaUrlFromIdAndTitle(manga.id, manga.title))
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main>
        {/* Hero */}
        <MangaHero manga={manga} />

        {/* Body */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 xl:gap-12">
            {/* Main content with tabs */}
            <div>
              <MangaTabs manga={manga} />
            </div>

            {/* Sidebar */}
            <MangaSidebar manga={manga} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
