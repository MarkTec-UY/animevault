/**
 * API Configuration
 * Client uses relative URLs - Next.js rewrites to Laravel backend
 * Server (SSR) uses INTERNAL_API_URL directly
 */

const isBrowser = typeof window !== 'undefined'

const API_URL = isBrowser
  ? '' // Browser: use relative URLs for Next.js rewrites
  : process.env.INTERNAL_API_URL || 'http://localhost:8000' // Server: direct backend

export const API_CONFIG = {
  baseUrl: API_URL,

  endpoints: {
    anime: {
      list: '/api/v1/anime',
      show: (id: number | string) => `/api/v1/anime/${id}`,
      relations: (id: number | string) => `/api/v1/anime/${id}/relations`,
      characters: (id: number | string) => `/api/v1/anime/${id}/characters`,
      staff: (id: number | string) => `/api/v1/anime/${id}/staff`,
      filters: '/api/v1/anime/filters',
    },
    manga: {
      list: '/api/v1/manga',
      show: (id: number | string) => `/api/v1/manga/${id}`,
      relations: (id: number | string) => `/api/v1/manga/${id}/relations`,
      characters: (id: number | string) => `/api/v1/manga/${id}/characters`,
      staff: (id: number | string) => `/api/v1/manga/${id}/staff`,
      filters: '/api/v1/manga/filters',
    },
    home: '/api/v1/home',
    auth: {
      register: '/auth/register',
      login: '/auth/login',
      logout: '/auth/logout',
      me: '/auth/me',
    },
    authSession: {
      login: '/auth/login',
      logout: '/auth/logout',
      me: '/auth/me',
    },
    user: {
      profile: (id: number | string) => `/api/v1/users/${id}`,
      library: (id: number | string) => `/api/v1/users/${id}/library`,
      favorites: (id: number | string) => `/api/v1/users/${id}/favorites`,
    },
    me: {
      profile: '/api/v1/me/profile',
      library: '/api/v1/me/library',
      favorites: '/api/v1/me/favorites',
      anime: (id: number | string) => `/api/v1/me/anime/${id}`,
      notifications: '/api/v1/me/notifications',
      notificationRead: (id: number | string) => `/api/v1/me/notifications/${id}/read`,
      notificationsReadAll: '/api/v1/me/notifications/read-all',
    },
  },

  getUrl: (endpoint: string): string => `${API_URL}${endpoint}`,

  getAnimeUrl: (id: number | string): string =>
    `${API_URL}${API_CONFIG.endpoints.anime.show(id)}`,
}
