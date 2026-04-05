export interface HomeAnime {
  id: number
  href: string
  title: string
  nativeTitle: string | null
  description: string | null
  score: number | null
  episodes: number | null
  genres: string[]
  coverImageUrl: string | null
  coverImageColor: string | null
  bannerImageUrl: string | null
  seasonLabel: string | null
  statusLabel: string | null
  studioName: string | null
  popularity: number | null
}

export interface HomeGenre {
  name: string
  slug: string
  animeCount: number
}

export interface HomeStat {
  label: string
  value: number
  description: string
}

export interface HomePageData {
  hero: {
    featured: HomeAnime | null
    spotlight: HomeAnime[]
  }
  trending: HomeAnime[]
  seasonal: {
    label: string
    items: HomeAnime[]
  }
  topRated: HomeAnime[]
  genres: HomeGenre[]
  stats: HomeStat[]
  generatedAt: string | null
}
