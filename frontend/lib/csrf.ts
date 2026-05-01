const CSRF_COOKIE_NAME = 'XSRF-TOKEN'

export async function fetchCsrfToken(): Promise<string> {
  const response = await fetch('/sanctum/csrf-cookie', {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('Failed to fetch CSRF token')
  }

  const cookies = response.headers.get('set-cookie')
  if (!cookies) {
    throw new Error('No CSRF cookie received')
  }

  const match = cookies.match(/XSRF-TOKEN=([^;]+)/)
  if (!match) {
    throw new Error('CSRF token not found in cookie')
  }

  return decodeURIComponent(match[1])
}

export async function getCsrfTokenFromDocument(): Promise<string> {
  const match = document.cookie.match(new RegExp(`(^| )${CSRF_COOKIE_NAME}=([^;]+)`))
  if (match) {
    return decodeURIComponent(match[2])
  }
  return fetchCsrfToken()
}