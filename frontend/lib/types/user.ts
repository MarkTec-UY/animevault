/**
 * User Profile Types
 * Types for user profiles, preferences, and related data
 */

export interface UserProfile {
  id: number
  username: string
  email?: string
  avatar?: string | null
  banner?: string | null
  about_me?: string | null
  timezone?: string
  is_profile_public: boolean
  preferred_title_language: "romaji" | "english" | "native"
  preferred_scoring_system: "point_100" | "point_10_decimal" | "point_10" | "star_5"
  created_at: string
  updated_at: string
  stats?: UserStats
}

export interface UserStats {
  total_anime: number
  watching: number
  completed: number
  plan_to_watch: number
  dropped: number
  total_episodes: number
  mean_score: number
}

export interface UpdateUserProfileRequest {
  about_me?: string
  avatar?: File
  banner?: File
  remove_avatar?: boolean
  remove_banner?: boolean
  timezone?: string
  is_profile_public?: boolean
  preferred_title_language?: "romaji" | "english" | "native"
  preferred_scoring_system?: "point_100" | "point_10_decimal" | "point_10" | "star_5"
}

export interface UserProfileResponse {
  user: UserProfile
}

export interface LibraryEntry {
  id: number
  anime_id: number
  status: "watching" | "completed" | "plan_to_watch" | "dropped" | "on_hold"
  progress_episodes: number
  score: number
  started_at?: string
  completed_at?: string
  created_at: string
  updated_at: string
  anime: {
    id: number
    title: string
    title_english?: string
    title_japanese?: string
    poster_image?: string
    cover_image?: string
    episodes?: number
    status: "airing" | "completed" | "upcoming"
    type: "tv" | "movie" | "ova" | "special" | "ona"
    genres?: string[]
    score?: number
  }
}

export interface UserLibraryResponse {
  data: LibraryEntry[]
  meta: {
    current_page: number
    per_page: number
    total: number
    last_page: number
  }
}

export interface FavoriteAnime {
  id: number
  anime_id: number
  created_at: string
  anime: {
    id: number
    title: string
    title_english?: string
    title_japanese?: string
    poster_image?: string
    cover_image?: string
    episodes?: number
    status: "airing" | "completed" | "upcoming"
    type: "tv" | "movie" | "ova" | "special" | "ona"
    genres?: string[]
    score?: number
  }
}

export interface UserFavoritesResponse {
  data: FavoriteAnime[]
  meta: {
    total: number
  }
}