"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { authAPI } from "@/lib/api/auth"
import type { LoginCredentials, RegisterCredentials, User } from "@/lib/types/auth"

const AUTH_QUERY_KEY = ["auth", "user"]

/**
 * Custom hook for authentication operations
 * Manages login, register, logout, and user state
 * Uses session-based cookie authentication with CSRF protection
 */
export function useAuth() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: AUTH_QUERY_KEY,
    queryFn: async () => {
      try {
        return await authAPI.getCurrentUser()
      } catch {
        return null
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 5,
  })

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => authAPI.login(credentials),
    onSuccess: (data) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, data.user)
      router.push(`/user/${data.user.username}`)
      router.refresh()
    },
  })

  const registerMutation = useMutation({
    mutationFn: (credentials: RegisterCredentials) => authAPI.register(credentials),
    onSuccess: (data) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, data.user)
      router.push(`/user/${data.user.username}`)
    },
  })

  const logoutMutation = useMutation({
    mutationFn: () => authAPI.logout(),
    onSuccess: () => {
      queryClient.setQueryData(AUTH_QUERY_KEY, null)
      router.push("/")
      router.refresh()
    },
  })

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    isLoginPending: loginMutation.isPending,
    loginError: loginMutation.error,
    register: registerMutation.mutate,
    registerAsync: registerMutation.mutateAsync,
    isRegisterPending: registerMutation.isPending,
    registerError: registerMutation.error,
    logout: logoutMutation.mutate,
    isLogoutPending: logoutMutation.isPending,
  }
}
