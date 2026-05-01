import { API_CONFIG } from "@/lib/api-config"
import { apiFetch } from "./client"
import type {
  UserProfile,
  UpdateUserProfileRequest,
  UserProfileResponse,
  UserLibraryResponse,
  UserFavoritesResponse,
} from "@/lib/types/user"

/**
 * User Profile API Service
 * Handles user profile operations, library, and favorites
 */

export const userAPI = {
  /**
   * Get current user's profile
   */
  async getCurrentProfile(): Promise<UserProfile> {
    const response = await apiFetch<UserProfileResponse>(API_CONFIG.endpoints.auth.me)
    return response.user
  },

  /**
   * Get public user profile by ID
   */
  async getPublicProfile(userId: number | string): Promise<UserProfile> {
    const response = await apiFetch<UserProfileResponse>(
      API_CONFIG.endpoints.user.profile(userId)
    )
    return response.user
  },

  /**
   * Update current user's profile
   */
  async updateProfile(data: UpdateUserProfileRequest): Promise<UserProfile> {
    const formData = new FormData()

    // Add text fields
    if (data.about_me !== undefined) {
      formData.append("about_me", data.about_me)
    }
    if (data.timezone !== undefined) {
      formData.append("timezone", data.timezone)
    }
    if (data.is_profile_public !== undefined) {
      formData.append("is_profile_public", String(data.is_profile_public))
    }
    if (data.preferred_title_language !== undefined) {
      formData.append("preferred_title_language", data.preferred_title_language)
    }
    if (data.preferred_scoring_system !== undefined) {
      formData.append("preferred_scoring_system", data.preferred_scoring_system)
    }

    // Add file fields
    if (data.avatar instanceof File) {
      formData.append("avatar", data.avatar)
    }
    if (data.banner instanceof File) {
      formData.append("banner", data.banner)
    }

    // Add removal flags
    if (data.remove_avatar) {
      formData.append("remove_avatar", "true")
    }
    if (data.remove_banner) {
      formData.append("remove_banner", "true")
    }

    const response = await apiFetch<UserProfileResponse>("/auth/profile", {
      method: "PUT",
      body: formData,
      headers: {
        // Don't set Content-Type for FormData, let the browser set it with boundary
      },
    })

    return response.user
  },

  /**
   * Get user's anime library
   */
  async getUserLibrary(
    userId: number | string,
    params?: {
      status?: string[]
      per_page?: number
      page?: number
    }
  ): Promise<UserLibraryResponse> {
    const queryParams = new URLSearchParams()
    if (params?.status) {
      queryParams.append("status", params.status.join(","))
    }
    if (params?.per_page) {
      queryParams.append("per_page", String(params.per_page))
    }
    if (params?.page) {
      queryParams.append("page", String(params.page))
    }

    const url = `${API_CONFIG.endpoints.user.library(userId)}${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`

    return apiFetch<UserLibraryResponse>(url)
  },

  /**
   * Get user's favorite anime
   */
  async getUserFavorites(userId: number | string): Promise<UserFavoritesResponse> {
    return apiFetch<UserFavoritesResponse>(API_CONFIG.endpoints.user.favorites(userId))
  },
}