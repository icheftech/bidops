'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { label: 'Dashboard',     href: '/dashboard' },
  { label: 'Opportunities', href: '/opportunities' },
  { label: 'Bids',          href: '/bids' },
  { label: 'Intelligence',  href: '/intelligence' },
  { label: 'Reporting',     href: '/reporting' },
  { label: 'Admin',         href: '/admin' },
]

export default function Topbar() {
  const path = usePathname()
  return (
    <header className="topbar">
      <div style={{ display:'flex', alignItems:'center' }}>
        <Link href="/dashboard" style={{ textDecoration:'none' }}>
          <div className="topbar-logo">BID<em>/</em>OPS</div>
        </Link>
        <nav className="topbar-nav">
          {NAV.map(({ label, href }) => (
            <Link key={href} href={href}
              className={`topbar-nav-item${path.startsWith(href) ? ' active' : ''}`}>
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <div className="agent-pill">
          <div className="agent-dot" />
          <span className="agent-label">AGENTS ACTIVE</span>
        </div>
      </div>
    </header>
  )
}
