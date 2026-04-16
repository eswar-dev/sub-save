'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuizStore } from '@/lib/store/quizStore'
import { track } from '@/lib/analytics'

const BETA_KEY = 'sps_beta_verified'

interface Props {
  open: boolean
  onClose: () => void
}

export function isBetaVerified(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(BETA_KEY) === '1'
}

export default function BetaGateSheet({ open, onClose }: Props) {
  const router = useRouter()
  const { startQuizWithEmail } = useQuizStore()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus input when sheet opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 350)
    } else {
      setInput('')
      setError('')
      setSuccess(false)
    }
  }, [open])

  const isEmail = input.includes('@')
  const isReady = input.trim().length >= 3

  async function handleVerify() {
    if (!isReady || loading) return
    setLoading(true)
    setError('')
    track('beta_gate_attempt', { is_email: isEmail })

    try {
      const res = await fetch('/api/beta/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: input.trim() }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Invalid code. Check your invite.')
        setLoading(false)
        return
      }

      // Success
      track('beta_gate_success', { path: data.path })
      localStorage.setItem(BETA_KEY, '1')

      // Pre-populate email if email path
      if (data.path === 'email' && data.email) {
        startQuizWithEmail(data.email)
      }

      setSuccess(true)
      setTimeout(() => {
        onClose()
        router.push('/quiz/apps')
      }, 800)
    } catch {
      setError('Something went wrong. Try again.')
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleVerify()
  }

  return (
    <>
      <div className={`b-overlay ${open ? 'open' : ''}`} onClick={onClose} />
      <div className={`b-sheet ${open ? 'open' : ''}`}>
        <div style={{ width: 36, height: 4, background: 'rgba(15,76,129,0.12)', borderRadius: 2, margin: '4px auto 18px' }} />

        {success ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>You&apos;re in!</div>
            <div style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>Loading your audit…</div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#1e293b', marginBottom: 4 }}>🔑 Beta access</div>
            <div style={{ fontSize: 13, color: '#475569', fontWeight: 500, marginBottom: 18, lineHeight: 1.5 }}>
              Enter your invite code, or the email you were invited with.
            </div>

            <input
              ref={inputRef}
              className="gate-input"
              type="text"
              placeholder="Code or invite email"
              value={input}
              onChange={(e) => {
                const val = e.target.value
                // Uppercase if looks like a code (no @)
                setInput(val.includes('@') ? val : val.toUpperCase())
                setError('')
              }}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              autoCapitalize="characters"
              style={{ marginBottom: error ? 8 : 16 }}
            />

            {error && (
              <div style={{ fontSize: 12, color: '#dc2626', marginBottom: 12, fontWeight: 500 }}>
                {error}
              </div>
            )}

            <button
              onClick={handleVerify}
              disabled={!isReady || loading}
              style={{
                width: '100%', height: 50,
                background: isReady ? 'linear-gradient(135deg, #0F4C81 0%, #2DD4BF 100%)' : 'rgba(148,163,184,0.3)',
                color: isReady ? '#fff' : '#94a3b8',
                border: 'none', borderRadius: 100,
                fontSize: 15, fontWeight: 700,
                cursor: isReady && !loading ? 'pointer' : 'default',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                transition: 'background 0.2s',
              }}
            >
              {loading ? 'Verifying…' : 'Get access →'}
            </button>

            <div style={{ textAlign: 'center', marginTop: 14, fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>
              Don&apos;t have a code?{' '}
              <a
                href="mailto:hello@subsmart.app"
                style={{ color: '#0F4C81', fontWeight: 600, textDecoration: 'none' }}
              >
                Request an invite →
              </a>
            </div>
          </>
        )}
      </div>
    </>
  )
}
