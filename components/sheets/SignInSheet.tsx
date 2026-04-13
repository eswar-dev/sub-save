'use client'

import { useState } from 'react'
import { useQuizStore } from '@/lib/store/quizStore'
import { AppResult } from '@/lib/scoring'
import { track } from '@/lib/analytics'

interface Props {
  open: boolean
  onClose: () => void
}

export default function SignInSheet({ open, onClose }: Props) {
  const { setReturningUser, startQuizWithEmail } = useQuizStore()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSignIn() {
    if (!email.includes('@')) return
    setLoading(true); setError('')
    track('signin_attempted')
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()

      if (!data.allowed) {
        setError(data.error ?? 'Please use a personal email (Gmail, Outlook, Yahoo, etc.)')
        setLoading(false)
        return
      }

      if (!data.found) {
        // New user — pre-fill email and start quiz
        track('signin_new_user')
        startQuizWithEmail(email)
        onClose()
        return
      }

      // Returning user — load last session
      setSuccess(true)
      if (typeof window !== 'undefined') localStorage.setItem('sps_email', email)
      setTimeout(() => {
        setReturningUser(email, data.session.apps_selected as AppResult[], data.session.created_at)
        onClose()
      }, 1200)
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  return (
    <>
      <div className={`b-overlay ${open ? 'open' : ''}`} onClick={onClose} />
      <div className={`b-sheet ${open ? 'open' : ''}`}>
        <div style={{ width: 36, height: 4, background: 'rgba(15,76,129,0.12)', borderRadius: 2, margin: '4px auto 18px' }} />

        {success ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>Welcome back!</div>
            <div style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>Loading your last audit…</div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#1e293b', marginBottom: 4 }}>👤 Welcome back</div>
            <div style={{ fontSize: 13, color: '#475569', fontWeight: 500, marginBottom: 16, lineHeight: 1.5 }}>
              Enter your email to see your saved results and manage reminders.
            </div>
            <input
              className="gate-input"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ marginBottom: 12 }}
            />
            {error && <div style={{ fontSize: 12, color: '#dc2626', marginBottom: 10, fontWeight: 500 }}>{error}</div>}
            <button
              onClick={handleSignIn}
              disabled={!email.includes('@') || loading}
              style={{
                width: '100%', height: 50,
                background: email.includes('@') ? 'linear-gradient(135deg, #0F4C81 0%, #2DD4BF 100%)' : 'rgba(148,163,184,0.3)',
                color: email.includes('@') ? '#fff' : '#94a3b8', border: 'none', borderRadius: 100,
                fontSize: 15, fontWeight: 700, cursor: email.includes('@') ? 'pointer' : 'default',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}
            >
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>
            <div style={{ textAlign: 'center', marginTop: 12, fontSize: 13, color: '#475569', fontWeight: 500 }}>
              New here?{' '}
              <button
                onClick={onClose}
                style={{ color: '#0F4C81', fontWeight: 700, cursor: 'pointer', background: 'none', border: 'none', textDecoration: 'underline', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 13 }}
              >
                Take the quiz →
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
