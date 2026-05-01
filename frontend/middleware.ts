import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_ONLY_ROUTES = ['/login', '/register']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublicOnlyRoute = PUBLIC_ONLY_ROUTES.some((route) => pathname === route)

  if (isPublicOnlyRoute) {
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}