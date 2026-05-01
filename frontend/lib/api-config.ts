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
      filters: '/api/v1/anime/filters',
    },
    home: '/api/v1/home',
    auth: {
      register: '/api/v1/auth/register',
      login: '/api/v1/auth/login',
      logout: '/api/v1/auth/logout',
      me: '/api/v1/auth/me',
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
    },
  },

  getUrl: (endpoint: string): string => `${API_URL}${endpoint}`,

  getAnimeUrl: (id: number | string): string =>
    `${API_URL}${API_CONFIG.endpoints.anime.show(id)}`,
}