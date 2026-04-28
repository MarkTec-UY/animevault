/**
 * Authentication Types
 * Centralized types for authentication-related data
 */

export interface LoginCredentials {
  email: string
  password: string
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
  createdAt: string
}

export interface AuthResponse {
  user: User
  token?: string
}

export interface AuthError {
  message: string
  errors?: Record<string, string[]>
}
