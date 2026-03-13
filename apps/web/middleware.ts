import { NextRequest, NextResponse } from 'next/server'

// ─── ROUTES THAT NEVER NEED A PASSWORD ───────────────────────
const PUBLIC = ['/api/auth', '/_next', '/favicon.ico']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Always allow public paths
  if (PUBLIC.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // ── PASSWORD GATE ──────────────────────────────────────────
  // Check for valid session cookie first
  const authCookie = req.cookies.get('bidops-auth')
  if (authCookie?.value === process.env.PORTAL_AUTH_TOKEN) {
    return NextResponse.next()
  }

  // If hitting the password page itself, allow through
  if (pathname === '/auth') {
    return NextResponse.next()
  }

  // If it's the auth POST endpoint, allow through
  if (pathname === '/api/auth/portal') {
    return NextResponse.next()
  }

  // Everything else → redirect to password gate
  const url = req.nextUrl.clone()
  url.pathname = '/auth'
  url.searchParams.set('from', pathname)
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
