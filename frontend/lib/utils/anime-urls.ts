import type { AnimeData } from "@/lib/types/anime"

/**
 * Convert a title string to URL-safe slug
 * e.g., "Cowboy Bebop" -> "Cowboy-Bebop"
 */
export function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .trim()
}

/**
 * Generate anime detail page URL
 * e.g., "/anime/1/Cowboy-Bebop"
 */
export function getAnimeUrl(anime: AnimeData): string {
  const slug = titleToSlug(anime.title)
  return `/anime/${anime.id}/${slug}`
}

/**
 * Generate anime detail page URL with ID and title
 */
export function getAnimeUrlFromIdAndTitle(id: number, title: string): string {
  const slug = titleToSlug(title)
  return `/anime/${id}/${slug}`
}
