import { API_CONFIG } from "@/lib/api-config"

export interface RequestOptions extends RequestInit {
  headers?: Record<string, string>
}

/**
 * HTTP client for API requests
 * Automatically handles JSON, errors, and auth headers
 */
export async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const url = endpoint.startsWith("http") ? endpoint : API_CONFIG.getUrl(endpoint)

  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      credentials: "include", // Include cookies for Sanctum auth
    })

    if (!response.ok) {
      if (response.status === 404) {
        const error = new Error("Not found")
        ;(error as any).status = 404
        throw error
      }
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    // Handle empty responses
    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      return {} as T
    }

    return response.json() as Promise<T>
  } catch (error) {
    // Provide better error messages for debugging
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      console.error(`Network error: Cannot reach API at ${url}`)
      console.error(`Make sure the backend is running at ${API_CONFIG.baseUrl}`)
    }
    throw error
  }
}

/**
 * Fetch JSON with error handling
 */
export async function fetchJson<T = unknown>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T | null> {
  try {
    return await apiFetch<T>(endpoint, options)
  } catch (error) {
    if ((error as any)?.status === 404) {
      return null
    }
    console.error("API request failed:", error)
    throw error
  }
}
