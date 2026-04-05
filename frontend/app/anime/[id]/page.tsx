import { redirect } from "next/navigation"
import { fetchAnimeById } from "@/lib/api/anime"
import { getAnimeUrl } from "@/lib/utils/anime-urls"

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
    // Anime doesn't exist - let 404 page handle it
    // Dynamic routes will return 404 by default
    return new Response("Not Found", { status: 404 })
  }

  // Redirect to canonical URL with title slug
  // This ensures /anime/1 redirects to /anime/1/cowboy-bebop
  redirect(getAnimeUrl(anime))
}
