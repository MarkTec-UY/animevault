/**
 * API Configuration
 * Centralizes all API URLs and endpoints
 */

// Use INTERNAL_API_URL for server-side requests (from containers)
// Use NEXT_PUBLIC_API_URL for client-side requests (from browser)
const API_URL =
  typeof window === "undefined"
    ? process.env.INTERNAL_API_URL || "http://localhost:8000"
    : process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export const API_CONFIG = {
  // Base URL
  baseUrl: API_URL,

  // Endpoints
  endpoints: {
    // Anime
    anime: {
      list: "/api/v1/anime",
      show: (id: number | string) => `/api/v1/anime/${id}`,
      filters: "/api/v1/anime/filters",
    },
    // Home/Dashboard
    home: "/api/v1/home",
    // Auth
    auth: {
      register: "/api/v1/auth/register",
      login: "/api/v1/auth/login",
      logout: "/api/v1/auth/logout",
      me: "/api/v1/auth/me",
    },
    // User
    user: {
      profile: (id: number | string) => `/api/v1/users/${id}`,
      library: (id: number | string) => `/api/v1/users/${id}/library`,
      favorites: (id: number | string) => `/api/v1/users/${id}/favorites`,
    },
  },

  /**
   * Build a full URL for an endpoint
   */
  getUrl: (endpoint: string): string => {
    return `${API_URL}${endpoint}`
  },

  /**
   * Build a full URL using endpoint helpers
   */
  getAnimeUrl: (id: number | string): string => {
    return `${API_URL}${API_CONFIG.endpoints.anime.show(id)}`
  },
}
