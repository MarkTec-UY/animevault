import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED_ROUTES = ['/dashboard', '/library', '/favorites', '/settings', '/profile']
const PUBLIC_ONLY_ROUTES = ['/login', '/register']

const SESSION_COOKIE_NAMES = [
  'animevault-session',
  'laravel_session',
]

function hasSessionCookie(request: NextRequest): boolean {
  return SESSION_COOKIE_NAMES.some((name) => request.cookies.get(name))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtectedRoute = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )

  const isPublicOnlyRoute = PUBLIC_ONLY_ROUTES.some((route) => pathname === route)

  if (isProtectedRoute) {
    if (!hasSessionCookie(request)) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  if (isPublicOnlyRoute) {
    if (hasSessionCookie(request)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}