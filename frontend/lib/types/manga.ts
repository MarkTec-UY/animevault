/**
 * Manga Data Types
 * Centralized types for manga-related data across the application
 */
import type { Character, Review, StaffMember, Trailer, ExternalLink } from "./anime"

export interface RelatedMedia {
  id: number
  title: string
  poster: string
  type: string
  relation: string
  score: number | null
  mediaType: "ANIME" | "MANGA"
}

export interface MangaData {
  id: number
  slug: string
  title: string
  jaTitle: string
  banner: string
  poster: string
  synopsis: string
  score: number
  rank: number
  popularity: number
  members: string
  type: string
  chapters: number
  volumes: number
  year: number
  status: string
  source: string
  is_adult: boolean
  genres: string[]
  themes: string[]
  characters: Character[]
  staff: StaffMember[]
  reviews: Review[]
  related: RelatedMedia[]
  scoreBreakdown: { label: string; value: number; count: string }[]
  trailer: Trailer | null
  externalLinks: ExternalLink[]
}
