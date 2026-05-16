import type { MangaData } from "@/lib/types/manga"
import { titleToSlug } from "./anime-urls"

/**
 * Generate manga detail page URL
 */
export function getMangaUrl(manga: MangaData): string {
  const slug = titleToSlug(manga.title)
  return `/manga/${manga.id}/${slug}`
}

/**
 * Generate manga detail page URL with ID and title
 */
export function getMangaUrlFromIdAndTitle(id: number | string, title: string): string {
  const slug = titleToSlug(title)
  return `/manga/${id}/${slug}`
}
