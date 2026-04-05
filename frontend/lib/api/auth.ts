import { API_CONFIG } from "@/lib/api-config"
import { apiFetch } from "./client"
import type { LoginCredentials, RegisterCredentials, AuthResponse, User } from "@/lib/types/auth"

/**
 * Authentication API Service
 * Handles login, register, logout, and user data fetching
 */

export const authAPI = {
  /**
   * Register a new user
   */
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    return apiFetch<AuthResponse>(API_CONFIG.endpoints.auth.register, {
      method: "POST",
      body: JSON.stringify(credentials),
    })
  },

  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return apiFetch<AuthResponse>(API_CONFIG.endpoints.auth.login, {
      method: "POST",
      body: JSON.stringify(credentials),
    })
  },

  /**
   * Logout the current user
   */
  async logout(): Promise<void> {
    return apiFetch<void>(API_CONFIG.endpoints.auth.logout, {
      method: "POST",
    })
  },

  /**
   * Get current user data
   */
  async getCurrentUser(): Promise<User> {
    return apiFetch<User>(API_CONFIG.endpoints.auth.me, {
      method: "GET",
    })
  },
}
