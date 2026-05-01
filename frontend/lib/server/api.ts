import { cookies, headers } from 'next/headers'

const API_BASE_URL = process.env.INTERNAL_API_URL || 'http://localhost:8000'

export interface ServerRequestOptions extends RequestInit {
  headers?: Record<string, string>
}

export async function apiFetchServer<T = unknown>(
  endpoint: string,
  options: ServerRequestOptions = {},
): Promise<T> {
  const cookieStore = await cookies()
  const headerStore = await headers()

  const cookieString = cookieStore.toString()
  console.log('[apiFetchServer] cookies:', cookieString)
  console.log('[apiFetchServer] endpoint:', endpoint)

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }

  if (cookieString) {
    defaultHeaders['Cookie'] = cookieString
  }

  const origin = headerStore.get('origin') || API_BASE_URL
  const referer = headerStore.get('referer') || origin

  defaultHeaders['Origin'] = origin
  defaultHeaders['Referer'] = referer

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorBody = await response.text()
      if (response.status === 401) {
        throw new Error('Unauthorized')
      }
      if (response.status === 404) {
        throw new Error('Not found')
      }
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      return {} as T
    }

    return response.json() as Promise<T>
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      console.error(`Network error: Cannot reach API at ${url}`)
    }
    throw error
  }
}