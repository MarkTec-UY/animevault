import { getCsrfTokenFromDocument } from "@/lib/csrf"
import { API_CONFIG } from "@/lib/api-config"
import { apiFetch } from "@/lib/api/client"

export interface NotificationAnimePreview {
  id: number
  preferred_title: string
  titles?: {
    romaji?: string | null
    english?: string | null
    native?: string | null
  }
  cover_image?: {
    color?: string | null
    large?: string | null
  } | null
}

export interface AnimeNotification {
  id: number
  type: string
  episode: number
  title: string
  body: string
  read_at: string | null
  created_at: string
  anime: NotificationAnimePreview | null
}

export interface NotificationsResponseMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
  unread_count: number
  unread_only: boolean
}

export interface NotificationsResponse {
  data: AnimeNotification[]
  meta: NotificationsResponseMeta
}

export interface NotificationsQuery {
  unreadOnly?: boolean
  page?: number
  perPage?: number
}

async function fetchWithCsrf<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const csrfToken = await getCsrfTokenFromDocument()

  const headers: Record<string, string> = {}
  if (options.headers) {
    for (const [key, value] of Object.entries(options.headers)) {
      headers[key] = value
    }
  }

  headers["X-XSRF-TOKEN"] = csrfToken

  return apiFetch<T>(endpoint, {
    ...options,
    headers,
  })
}

function buildNotificationsQueryString(query: NotificationsQuery = {}): string {
  const params = new URLSearchParams()

  if (query.unreadOnly) {
    params.set("unread_only", "true")
  }

  if (query.page) {
    params.set("page", String(query.page))
  }

  if (query.perPage) {
    params.set("per_page", String(query.perPage))
  }

  const queryString = params.toString()

  return queryString ? `?${queryString}` : ""
}

export const notificationsAPI = {
  async list(query: NotificationsQuery = {}): Promise<NotificationsResponse> {
    return apiFetch<NotificationsResponse>(
      `${API_CONFIG.endpoints.me.notifications}${buildNotificationsQueryString(query)}`,
    )
  },

  async markAsRead(notificationId: number): Promise<AnimeNotification> {
    return fetchWithCsrf<AnimeNotification>(
      API_CONFIG.endpoints.me.notificationRead(notificationId),
      {
        method: "POST",
      },
    )
  },

  async markAllAsRead(): Promise<{ updated: number; unread_count: number }> {
    return fetchWithCsrf<{ updated: number; unread_count: number }>(
      API_CONFIG.endpoints.me.notificationsReadAll,
      {
        method: "POST",
      },
    )
  },
}
