import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

/**
 * Password-gate auth — Phase 1
 * Full per-user NextAuth will be added in Phase 2
 * when user management and roles are needed.
 */

export function isAuthenticated(): boolean {
  const cookieStore = cookies()
  const token = cookieStore.get('bidops-auth')?.value
  return token === process.env.PORTAL_AUTH_TOKEN
}

export function requireAuth() {
  if (!isAuthenticated()) {
    redirect('/auth')
  }
}

// Stub session shape — keeps dashboard/opportunities pages working
// without NextAuth. Replace with real session in Phase 2.
export function getStubSession() {
  return {
    user: {
      id:          'owner',
      email:       'leroy@southernshadetechnologies.com',
      name:        'Leroy Brown',
      tenantId:    process.env.DEFAULT_TENANT_ID ?? '',
      tenantSlug:  'southern-shade',
      role:        'OWNER',
    }
  }
}

export async function requireSession() {
  requireAuth()
  return getStubSession()
}

export async function getSession() {
  if (!isAuthenticated()) return null
  return getStubSession()
}
