'use client'

import { useState } from 'react'
import { useQuizStore } from '@/lib/store/quizStore'
import { AppResult } from '@/lib/scoring'
import { getLogoUrl, hashColor } from '@/lib/data/apps'
import { track } from '@/lib/analytics'

interface Props {
  app: AppResult
  onClose: () => void
  onSuccess: () => void
  onSignIn?: () => void
}

const verdictColors: Record<string, string> = { cancel: '#dc2626', review: '#d97706', keep: '#0d9488' }
const verdictLabels: Record<string, string> = { cancel: 'CANCEL', review: 'REVIEW', keep: 'KEEP' }

export default function ReminderGateSheet({ app, onClose, onSuccess, onSignIn }: Props) {
  const { setReminderPaid, sessionId, userEmail } = useQuizStore()
  const [email, setEmail] = useState(userEmail ?? '')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [imgError, setImgError] = useState(false)

  async function handleActivate() {
    if (!email.includes('@') || loading) return
    setLoading(true)
    track('reminder_activate_tapped')
    try {
      const sid = sessionId ?? (typeof window !== 'undefined' ? localStorage.getItem('sps_session_id') : null)
      if (sid) {
        await fetch(`/api/sessions/${sid}/reminder-paid`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })
      }
      setReminderPaid(email)
      track('email_captured', { source: 'reminder_gate' })
      setSuccess(true)
      setTimeout(() => onSuccess(), 1400)
    } catch {
      setError('Something went wrong. Try again.')
    }
    setLoading(false)
  }

  return (
    <>
      <div className="b-overlay open" onClick={onClose} />
      <div className="b-sheet open" style={{ maxHeight: '72%', overflowY: 'auto' }}>
        <div style={{ width: 36, height: 4, background: 'rgba(15,76,129,0.12)', borderRadius: 2, margin: '4px auto 18px' }} />

        {success ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>Reminders activated!</div>
            <div style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>Tap any card to set a renewal date.</div>
          </div>
        ) : (
          <>
            {/* App row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              {app.custom || imgError ? (
                <div style={{ width: 44, height: 44, borderRadius: 12, background: hashColor(app.id), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                  {app.name[0]}
                </div>
              ) : (
                <img src={getLogoUrl(app.domain)} alt={app.name} width={44} height={44}
                  style={{ borderRadius: 12, objectFit: 'contain', background: '#fff', padding: 4 }}
                  onError={() => setImgError(true)}
                />
              )}
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#1e293b' }}>{app.name}</div>
                <div style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>₹{app.price}/mo</div>
              </div>
              <div style={{
                marginLeft: 'auto', fontSize: 10, fontWeight: 800, padding: '5px 10px',
                borderRadius: 100, background: `${verdictColors[app.verdict]}1a`, color: verdictColors[app.verdict],
                textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                {verdictLabels[app.verdict]}
              </div>
            </div>

            <div style={{ fontSize: 14, color: '#475569', fontWeight: 500, lineHeight: 1.5, margin: '14px 0 16px' }}>
              Get reminded before {app.name} charges you again. Free — we&apos;ll email you before renewal.
            </div>

            <input
              className="gate-input"
              type="email"
              placeholder="your@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ marginBottom: 10 }}
            />
            {error && <div style={{ fontSize: 12, color: '#dc2626', marginBottom: 10, fontWeight: 500 }}>{error}</div>}

            <button
              onClick={handleActivate}
              disabled={!email.includes('@') || loading}
              style={{
                width: '100%', height: 50,
                background: email.includes('@') ? 'linear-gradient(135deg, #0F4C81 0%, #2DD4BF 100%)' : 'rgba(148,163,184,0.3)',
                color: email.includes('@') ? '#fff' : '#94a3b8', border: 'none', borderRadius: 100,
                fontSize: 15, fontWeight: 700, cursor: email.includes('@') ? 'pointer' : 'default',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}
            >
              {loading ? 'Activating…' : 'Activate reminders — free →'}
            </button>

            <div style={{ textAlign: 'center', marginTop: 10, fontSize: 13, color: '#475569', fontWeight: 500 }}>
              Already have an account?{' '}
              <button
                onClick={() => { onClose(); onSignIn?.() }}
                style={{ color: '#0F4C81', fontWeight: 700, cursor: 'pointer', background: 'none', border: 'none', textDecoration: 'underline', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 13 }}
              >
                Sign in →
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
