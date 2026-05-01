"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/api/client"
import { getCsrfTokenFromDocument } from "@/lib/csrf"

interface User {
  id: number
  username: string
  email: string
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      try {
        const csrfToken = await getCsrfTokenFromDocument()
        const response = await apiFetch<{ user: User }>("/auth/me", {
          headers: {
            "X-XSRF-TOKEN": csrfToken,
          },
        })
        setUser(response.user)
      } catch {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [])

  return { user, loading }
}