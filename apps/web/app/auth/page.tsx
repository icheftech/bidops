'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function AuthForm() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const params = useSearchParams()
  const from = params.get('from') || '/dashboard'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      router.push(from)
    } else {
      setError('Incorrect password.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080808',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@800&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 30px #111111 inset !important;
          -webkit-text-fill-color: #f4f2ee !important;
        }
      `}</style>

      <div style={{ width: '100%', maxWidth: 380, padding: '0 24px' }}>

        {/* Logo */}
        <div style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 22,
          fontWeight: 800,
          color: '#c9a84c',
          letterSpacing: '0.04em',
          marginBottom: 8,
          textAlign: 'center',
        }}>
          BID<span style={{ color: 'rgba(244,242,238,0.22)' }}>/</span>OPS
        </div>
        <div style={{
          fontSize: 11,
          color: 'rgba(244,242,238,0.22)',
          letterSpacing: '0.1em',
          textAlign: 'center',
          textTransform: 'uppercase',
          marginBottom: 40,
        }}>
          Southern Shade Technologies
        </div>

        {/* Card */}
        <div style={{
          background: '#0d0d0d',
          border: '1px solid rgba(244,242,238,0.07)',
          borderRadius: 8,
          padding: '28px 28px 24px',
        }}>
          <div style={{ fontSize: 13, color: 'rgba(244,242,238,0.45)', marginBottom: 20 }}>
            Enter your portal password to continue.
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                required
                autoFocus
                style={{
                  width: '100%',
                  background: '#111111',
                  border: `1px solid ${error ? 'rgba(192,57,43,0.6)' : 'rgba(244,242,238,0.12)'}`,
                  borderRadius: 5,
                  padding: '10px 14px',
                  color: '#f4f2ee',
                  fontSize: 13,
                  fontFamily: "'DM Sans', sans-serif",
                  outline: 'none',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => { if (!error) e.target.style.borderColor = 'rgba(201,168,76,0.4)' }}
                onBlur={e => { if (!error) e.target.style.borderColor = 'rgba(244,242,238,0.12)' }}
              />
              {error && (
                <div style={{ fontSize: 11, color: '#e05a4e', marginTop: 6 }}>{error}</div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: loading ? 'rgba(201,168,76,0.08)' : 'rgba(201,168,76,0.14)',
                border: '1px solid rgba(201,168,76,0.28)',
                color: '#c9a84c',
                padding: '10px',
                borderRadius: 5,
                fontSize: 13,
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
                letterSpacing: '0.01em',
              }}
            >
              {loading ? 'Verifying…' : 'Enter Portal →'}
            </button>
          </form>
        </div>

        <div style={{
          fontSize: 10,
          color: 'rgba(244,242,238,0.15)',
          textAlign: 'center',
          marginTop: 24,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}>
          Authorized access only
        </div>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  )
}
