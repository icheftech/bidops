// NextAuth disabled in Phase 1 — using password gate auth
// Will be re-enabled in Phase 2 for per-user login
import { NextResponse } from 'next/server'
export async function GET() { return NextResponse.json({ disabled: true }) }
export async function POST() { return NextResponse.json({ disabled: true }) }
