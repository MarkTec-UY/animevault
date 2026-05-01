/**
 * Profile types aligned with the AnimeVault database schema.
 *
 * users: name, email, about_me, avatar_path, banner_path, timezone,
 *        is_profile_public, preferred_title_language, preferred_scoring_system
 * user_anime_library.status: watching | completed | paused | dropped | planning
 */

export type LibraryStatus =
  | "watching"
  | "completed"
  | "paused"
  | "dropped"
  | "planning"

export type TitleLanguage = "romaji" | "english" | "native"

export type ScoringSystem =
  | "point_100"
  | "point_10_decimal"
  | "point_10"
  | "star_5"

export interface ProfileUser {
  id: number
  name: string
  username: string
  email?: string | null
  about_me?: string | null
  avatar_path?: string | null
  avatar_url?: string | null
  banner_path?: string | null
  banner_url?: string | null
  timezone?: string | null
  is_profile_public: boolean
  preferred_title_language: TitleLanguage
  preferred_scoring_system: ScoringSystem
  email_verified_at?: string | null
  created_at?: string
  updated_at?: string
}

export interface ProfileAnimeRef {
  id: number
  title: string
  cover_image_large?: string | null
  banner_image?: string | null
  average_score?: number | null
  popularity?: number | null
  favourites?: number | null
  episodes?: number | null
}

export interface LibraryItem {
  id: number
  user_id: number
  anime_id: number
  status: LibraryStatus
  progress_episodes: number
  score: number | null
  started_at?: string | null
  completed_at?: string | null
  anime: ProfileAnimeRef
}

export interface FavoriteItem {
  id: number
  user_id: number
  anime_id: number
  created_at: string
  anime: ProfileAnimeRef
}

export interface NotificationItem {
  id: number
  user_id: number
  anime_id?: number | null
  type: string
  title: string
  message?: string | null
  read_at?: string | null
  created_at: string
  anime?: ProfileAnimeRef | null
}

export interface ProfileStatsSummary {
  total: number
  watching: number
  completed: number
  paused: number
  dropped: number
  planning: number
  total_episodes: number
  mean_score: number
}

export interface ProfilePayload {
  user: ProfileUser
  is_own_profile: boolean
  stats: ProfileStatsSummary
  library: LibraryItem[]
  favorites: FavoriteItem[]
  notifications?: NotificationItem[]
}
