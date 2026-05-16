/**
 * Anime Data Types
 * Centralized types for anime-related data across the application
 */

export interface Character {
  id: number
  name: string
  role: string
  image: string
  voiceActor: string
  voiceActors?: Array<{
    id: number
    name: string
    image: string
    language: string | null
    roleNotes: string | null
    dubGroup: string | null
  }>
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
  id: number
  entryKey: string
  name: string
  role: string
  image: string
  occupations?: string[]
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
  score: number | null
  mediaType: "ANIME" | "MANGA"
}

export interface Trailer {
  id: string
  site: string
  thumbnail: string | null
}

export interface Company {
  id: number
  name: string
  isMain: boolean
}

export interface ExternalLink {
  id: number
  site: string
  url: string
  type: string | null
  language: string | null
  color: string | null
  icon: string | null
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
  nextAiringAt: string | null
  nextAiringEpisode: number | null
  themes: string[]
  characters: Character[]
  episodes_list: Episode[]
  staff: StaffMember[]
  reviews: Review[]
  related: RelatedAnime[]
  scoreBreakdown: { label: string; value: number; count: string }[]
  trailer: Trailer | null
  companies: Company[]
  externalLinks: ExternalLink[]
}
