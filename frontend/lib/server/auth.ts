import { cookies } from 'next/headers'
import { apiFetchServer } from './api'

export interface ServerUser {
  id: number
  username: string
  email: string
  avatar?: string | null
  role: string
  is_profile_public: boolean
  created_at: string
  avatar_url?: string | null
}

export async function getServerUser(): Promise<ServerUser | null> {
  'use server'

  try {
    const response = await apiFetchServer<{ user: ServerUser }>('/auth/me')
    return response.user
  } catch {
    return null
  }
}

export async function isAuthenticated(): Promise<boolean> {
  'use server'

  const user = await getServerUser()
  return user !== null
}

export async function requireServerUser(): Promise<ServerUser> {
  'use server'

  const user = await getServerUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

export async function getCsrfToken(): Promise<string> {
  'use server'

  const cookieStore = await cookies()
  const csrfToken = cookieStore.get('XSRF-TOKEN')?.value

  if (!csrfToken) {
    throw new Error('CSRF token not found')
  }

  return csrfToken
}
