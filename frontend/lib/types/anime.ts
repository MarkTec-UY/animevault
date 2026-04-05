/**
 * Anime Data Types
 * Centralized types for anime-related data across the application
 */

export interface Character {
  id: number
  name: string
  role: "Main" | "Supporting"
  image: string
  voiceActor: string
}

export interface Episode {
  number: number
  title: string
  airDate: string
  duration: string
  score: number | null
  thumbnail: string
  isRecap?: boolean
  isFiller?: boolean
}

export interface StaffMember {
  name: string
  role: string
  image: string
}

export interface Review {
  id: number
  author: string
  avatar: string
  score: number
  date: string
  body: string
  helpful: number
}

export interface RelatedAnime {
  id: number
  title: string
  poster: string
  type: string
  relation: string
  score: number
}

export interface AnimeData {
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
  episodes: number
  duration: string
  season: string
  year: number
  status: string
  studio: string
  source: string
  rating: string
  isAiring: boolean
  genres: string[]
  themes: string[]
  characters: Character[]
  episodes_list: Episode[]
  staff: StaffMember[]
  reviews: Review[]
  related: RelatedAnime[]
  scoreBreakdown: { label: string; value: number; count: string }[]
}
