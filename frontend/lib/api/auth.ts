import { API_CONFIG } from "@/lib/api-config"
import { apiFetch, type RequestOptions } from "./client"
import { getCsrfTokenFromDocument } from "@/lib/csrf"
import type { LoginCredentials, RegisterCredentials, AuthResponse, User } from "@/lib/types/auth"

/**
 * Authentication API Service
 * Handles login, register, logout, and user data fetching
 * Uses session-based cookie authentication with CSRF protection
 */

async function fetchWithCsrf<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const csrfToken = await getCsrfTokenFromDocument()

  const headers: Record<string, string> = {}
  if (options.headers) {
    for (const [key, value] of Object.entries(options.headers)) {
      headers[key] = value
    }
  }
  headers['X-XSRF-TOKEN'] = csrfToken

  return apiFetch<T>(endpoint, {
    ...options,
    headers,
  })
}

export const authAPI = {
  /**
   * Register a new user
   */
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    return fetchWithCsrf<AuthResponse>(API_CONFIG.endpoints.auth.register, {
      method: "POST",
      body: JSON.stringify(credentials),
    })
  },

  /**
   * Login with email and password (session-based)
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return fetchWithCsrf<AuthResponse>('/auth/login', {
      method: "POST",
      body: JSON.stringify(credentials),
    })
  },

  /**
   * Logout the current user (session-based)
   */
  async logout(): Promise<void> {
    return fetchWithCsrf<void>('/auth/logout', {
      method: "POST",
    })
  },

  /**
   * Get current user data (session-based)
   */
  async getCurrentUser(): Promise<User> {
    return fetchWithCsrf<{ user: User }>('/auth/me', {
      method: "GET",
    }).then((response) => response.user)
  },
}
