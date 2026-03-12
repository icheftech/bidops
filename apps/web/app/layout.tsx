import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BidOps — Autonomous Contract Intelligence',
  description: 'AI-powered government contract sourcing and bid preparation',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
