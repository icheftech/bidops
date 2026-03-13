import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { password } = await req.json()

  const PORTAL_PASSWORD = process.env.PORTAL_PASSWORD
  const AUTH_TOKEN      = process.env.PORTAL_AUTH_TOKEN

  if (!PORTAL_PASSWORD || !AUTH_TOKEN) {
    return NextResponse.json({ error: 'Portal auth not configured' }, { status: 500 })
  }

  if (password !== PORTAL_PASSWORD) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }

  // Set auth cookie — httpOnly, secure in production
  const res = NextResponse.json({ ok: true })
  res.cookies.set('bidops-auth', AUTH_TOKEN, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  })

  return res
}
