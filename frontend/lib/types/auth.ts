/**
 * Authentication Types
 * Centralized types for authentication-related data
 */

export interface LoginCredentials {
  email: string
  password: string
  remember?: boolean
}

export interface RegisterCredentials extends LoginCredentials {
  username: string
  password_confirmation: string
}

export interface User {
  id: number
  username: string
  email: string
  avatar?: string
  avatar_url?: string | null
  role: string
  created_at?: string
  createdAt?: string
  is_profile_public?: boolean
}

export interface AuthResponse {
  user: User
  token?: string
}

export interface AuthError {
  message: string
  errors?: Record<string, string[]>
}
