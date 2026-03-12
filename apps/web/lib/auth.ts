import { NextAuthOptions, getServerSession } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from '@bidops/db'

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id
        token.tenantId = (user as any).tenantId
        token.tenantSlug = (user as any).tenantSlug
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.userId as string
      session.user.tenantId = token.tenantId as string
      session.user.tenantSlug = token.tenantSlug as string
      session.user.role = token.role as string
      return session
    },
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await db.user.findFirst({
          where: { email: credentials.email },
          include: { tenant: true },
        })

        if (!user || user.tenant.status === 'SUSPENDED') return null

        // TODO: Add bcrypt password check once password field is added
        // For now returns user for scaffold — add auth in Phase 1 completion
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          tenantId: user.tenantId,
          tenantSlug: user.tenant.slug,
          role: user.role,
        }
      },
    }),
  ],
}

export const getSession = () => getServerSession(authOptions)

export async function requireSession() {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')
  return session
}
