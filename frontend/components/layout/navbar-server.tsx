import { getServerUser } from '@/lib/server/auth'
import { NavbarClient } from './navbar-client'
import type { User } from '@/lib/types/auth'

async function getUser(): Promise<User | null> {
  try {
    const serverUser = await getServerUser()
    if (!serverUser) return null

    return {
      id: serverUser.id,
      username: serverUser.username,
      email: serverUser.email,
      avatar_url: serverUser.avatar_url ?? undefined,
      avatar: serverUser.avatar ?? undefined,
      role: serverUser.role,
      createdAt: serverUser.created_at,
    }
  } catch {
    return null
  }
}

export async function NavbarServer() {
  const user = await getUser()

  return <NavbarClient user={user} />
}