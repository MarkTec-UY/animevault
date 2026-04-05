import { redirect } from "next/navigation"
import { fetchAnimeById } from "@/lib/api/anime"
import { getAnimeUrl } from "@/lib/utils/anime-urls"
import AnimeNotFound from "@/components/anime/anime-not-found"

/**
 * Fallback route for /anime/[id] (without title)
 * Redirects to canonical URL with correct title slug
 */
export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AnimeIdPage({ params }: PageProps) {
  const { id } = await params

  // Fetch anime by ID
  const anime = await fetchAnimeById(id)

  if (!anime) {
    // Display friendly error page instead of generic 404
    return <AnimeNotFound id={id} />
  }

  // Redirect to canonical URL with title slug
  // This ensures /anime/1 redirects to /anime/1/cowboy-bebop
  redirect(getAnimeUrl(anime))
}
