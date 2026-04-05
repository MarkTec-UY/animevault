import "server-only"

import { sanitizeHtml } from "@/lib/utils/text"
import type { HomeAnime, HomeGenre, HomePageData, HomeStat } from "@/features/home/types"

export const HOME_PAGE_REVALIDATE_SECONDS = 300

interface ApiReference {
  code: string
  description: string | null
}

interface ApiHomeAnime {
  id: number
  preferred_title: string | null
  titles: {
    romaji: string | null
    english: string | null
    native: string | null
  }
  episodes: number | null
  season: ApiReference | null
  season_year: number | null
  status: ApiReference | null
  average_score: number | null
  popularity: number | null
  cover_image: {
    color: string | null
    large: string | null
  }
  banner_image: string | null
  genres: string[]
  main_studio: {
    id: number
    name: string
  } | null
  description?: string | null
}

interface ApiHomeGenre {
  name: string
  slug: string
  anime_count: number
}

interface ApiHomeStat {
  label: string
  value: number
  description: string
}

interface ApiHomePageData {
  hero: {
    featured: ApiHomeAnime | null
    spotlight: ApiHomeAnime[]
  }
  trending: ApiHomeAnime[]
  seasonal: {
    label: string
    items: ApiHomeAnime[]
  }
  top_rated: ApiHomeAnime[]
  genres: ApiHomeGenre[]
  stats: ApiHomeStat[]
  generated_at: string | null
}

const emptyHomePageData: HomePageData = {
  hero: {
    featured: null,
    spotlight: [],
  },
  trending: [],
  seasonal: {
    label: "Latest season",
    items: [],
  },
  topRated: [],
  genres: [],
  stats: [],
  generatedAt: null,
}

export async function getHomePageData(): Promise<HomePageData> {
  const apiBaseUrl = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL

  if (!apiBaseUrl) {
    return emptyHomePageData
  }

  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/home`, {
      headers: {
        Accept: "application/json",
      },
      next: {
        revalidate: HOME_PAGE_REVALIDATE_SECONDS,
      },
    })

    if (!response.ok) {
      throw new Error(`Home API responded with ${response.status}`)
    }

    const payload = (await response.json()) as ApiHomePageData

    return {
      hero: {
        featured: payload.hero.featured ? mapAnime(payload.hero.featured) : null,
        spotlight: payload.hero.spotlight.map(mapAnime),
      },
      trending: payload.trending.map(mapAnime),
      seasonal: {
        label: payload.seasonal.label,
        items: payload.seasonal.items.map(mapAnime),
      },
      topRated: payload.top_rated.map(mapAnime),
      genres: payload.genres.map(mapGenre),
      stats: payload.stats.map(mapStat),
      generatedAt: payload.generated_at,
    }
  } catch (error) {
    console.error("Failed to load home page data", error)
    return emptyHomePageData
  }
}

function mapAnime(anime: ApiHomeAnime): HomeAnime {
  const title = anime.preferred_title ?? anime.titles.romaji ?? anime.titles.native ?? `Anime #${anime.id}`
  const titleSlug = slugify(title)
  
  return {
    id: anime.id,
    href: `/anime/${anime.id}/${titleSlug}`,
    title,
    nativeTitle: anime.titles.native,
    description: anime.description ? sanitizeHtml(anime.description) : null,
    score: anime.average_score === null ? null : anime.average_score / 10,
    episodes: anime.episodes,
    genres: anime.genres,
    coverImageUrl: anime.cover_image.large,
    coverImageColor: anime.cover_image.color,
    bannerImageUrl: anime.banner_image,
    seasonLabel: joinSeasonLabel(anime.season?.description ?? null, anime.season_year),
    statusLabel: anime.status?.description ?? null,
    studioName: anime.main_studio?.name ?? null,
    popularity: anime.popularity,
  }
}

function mapGenre(genre: ApiHomeGenre): HomeGenre {
  return {
    name: genre.name,
    slug: genre.slug,
    animeCount: genre.anime_count,
  }
}

function mapStat(stat: ApiHomeStat): HomeStat {
  return {
    label: stat.label,
    value: stat.value,
    description: stat.description,
  }
}

function joinSeasonLabel(season: string | null, year: number | null): string | null {
  if (!season && year === null) {
    return null
  }

  return [season, year].filter((value) => value !== null).join(" ")
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}
