import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, AUTH_COOKIE } from '@/lib/auth-utils'

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/admin')) {
    const token = req.cookies.get(AUTH_COOKIE)?.value
    const payload = token ? verifyToken(token) : null

    if (!payload || payload.role !== 'admin') {
      const loginUrl = req.nextUrl.clone()
      loginUrl.pathname = '/login'
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  const res = NextResponse.next()
  res.headers.set('ngrok-skip-browser-warning', 'true')
  return res
}

export const config = {
  matcher: ['/admin/:path*', '/((?!_next/webpack-hmr).*)'],
}
