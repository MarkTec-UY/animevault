import { API_CONFIG } from "@/lib/api-config"

export interface RequestOptions extends RequestInit {
  headers?: Record<string, string>
}

interface ApiErrorBody {
  message?: string
  errors?: Record<string, string[]>
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly errors?: Record<string, string[]>,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

async function parseErrorBody(response: Response): Promise<ApiErrorBody | null> {
  const contentType = response.headers.get("content-type")

  if (!contentType?.includes("application/json")) {
    return null
  }

  const data = (await response.json()) as ApiErrorBody
  return data
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
      const errorBody = await parseErrorBody(response)

      if (response.status === 401) {
        throw new ApiError(
          errorBody?.message || "Credenciales inválidas",
          response.status,
        )
      }

      if (response.status === 422) {
        const message =
          errorBody?.message ||
          (errorBody?.errors
            ? Object.values(errorBody.errors).flat().join(", ")
            : "Validation error")

        throw new ApiError(message, response.status, errorBody?.errors)
      }

      if (response.status === 404) {
        throw new ApiError("Not found", response.status)
      }

      throw new ApiError(
        errorBody?.message || `API error: ${response.status} ${response.statusText}`,
        response.status,
        errorBody?.errors,
      )
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
    if (error instanceof ApiError && error.status === 404) {
      return null
    }
    console.error("API request failed:", error)
    throw error
  }
}
