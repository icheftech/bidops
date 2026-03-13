'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

const navItems = [
  { href: '/dashboard',       label: 'Dashboard',       icon: '◈' },
  { href: '/opportunities',   label: 'Opportunities',   icon: '⬡' },
  { href: '/bids',            label: 'Bids',            icon: '⬢' },
  { href: '/intelligence',    label: 'Intelligence',    icon: '◉' },
  { href: '/subcontractors',  label: 'Subcontractors',  icon: '⬡' },
  { href: '/reporting',       label: 'Reporting',       icon: '⬢' },
]

const adminItems = [
  { href: '/admin', label: 'Admin', icon: '◈' },
]

interface Props {
  user: {
    name?:  string | null
    email?: string | null
    role?:  string
  }
  children: React.ReactNode
}

export function DashboardShell({ user, children }: Props) {
  const pathname = usePathname()
  const isAdmin  = user.role === 'OWNER' || user.role === 'ADMIN'

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* ── SIDEBAR ── */}
      <aside className="w-56 shrink-0 flex flex-col border-r border-gray-200 bg-brand-900">

        {/* Logo */}
        <div className="px-5 py-5 border-b border-brand-800">
          <span className="text-white font-bold text-lg tracking-tight">BidOps</span>
          <span className="block text-brand-400 text-[10px] tracking-widest uppercase mt-0.5">
            Contract Intelligence
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <div className="space-y-0.5">
            {navItems.map(({ href, label, icon }) => {
              const active = pathname === href || pathname.startsWith(href + '/')
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-brand-700 text-white'
                      : 'text-brand-300 hover:bg-brand-800 hover:text-white'
                  }`}
                >
                  <span className="text-base leading-none">{icon}</span>
                  {label}
                </Link>
              )
            })}
          </div>

          {isAdmin && (
            <>
              <div className="my-3 border-t border-brand-800" />
              <div className="space-y-0.5">
                {adminItems.map(({ href, label, icon }) => {
                  const active = pathname.startsWith(href)
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        active
                          ? 'bg-brand-700 text-white'
                          : 'text-brand-300 hover:bg-brand-800 hover:text-white'
                      }`}
                    >
                      <span className="text-base leading-none">{icon}</span>
                      {label}
                    </Link>
                  )
                })}
              </div>
            </>
          )}
        </nav>

        {/* User footer */}
        <div className="border-t border-brand-800 px-4 py-4">
          <p className="text-white text-xs font-medium truncate">{user.name ?? user.email}</p>
          <p className="text-brand-400 text-[10px] tracking-wide uppercase mt-0.5">{user.role}</p>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="mt-3 text-[11px] text-brand-400 hover:text-white transition-colors"
          >
            Sign out →
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

    </div>
  )
}
