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
}

const verdictColors: Record<string, string> = { cancel: '#dc2626', review: '#d97706', keep: '#0d9488' }
const verdictLabels: Record<string, string> = { cancel: 'CANCEL', review: 'REVIEW', keep: 'KEEP' }

export default function ReminderGateSheet({ app, onClose, onSuccess }: Props) {
  const { setReminderPaid, sessionId } = useQuizStore()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [imgError, setImgError] = useState(false)

  async function handleActivate() {
    if (!email.includes('@') || loading) return
    setLoading(true)
    track('payment_initiated')
    try {
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: localStorage.getItem('sps_session_id'), email }),
      })
      const { order_id, amount, currency } = await res.json()

      // Open Razorpay checkout
      const rzpKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
      if (!rzpKey || !order_id) {
        // Fallback for when Razorpay is not configured (demo mode)
        handlePaymentSuccess(email)
        return
      }

      const options = {
        key: rzpKey,
        amount,
        currency,
        order_id,
        name: 'SUB PAY SAVER',
        description: 'Lifetime reminder access',
        prefill: { email },
        theme: { color: '#0F4C81' },
        handler: () => handlePaymentSuccess(email),
      }

      if (typeof window !== 'undefined' && (window as any).Razorpay) {
        const rzp = new (window as any).Razorpay(options)
        rzp.open()
      } else {
        // Razorpay SDK not loaded — demo fallback
        handlePaymentSuccess(email)
      }
    } catch {
      // Demo fallback
      handlePaymentSuccess(email)
    }
    setLoading(false)
  }

  function handlePaymentSuccess(userEmail: string) {
    setReminderPaid(userEmail)
    track('payment_completed', {})
    track('email_captured', { source: 'gate' })

    // Persist reminder_paid flag to DB so the reminder API allows writes
    const sid = sessionId ?? localStorage.getItem('sps_session_id')
    if (sid) {
      fetch(`/api/sessions/${sid}/reminder-paid`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      }).catch(() => {})
    }

    setSuccess(true)
    setTimeout(() => { onSuccess() }, 1400)
  }

  return (
    <>
      <div className="b-overlay open" onClick={onClose} />
      <div className="b-sheet open" style={{ maxHeight: '72%', overflowY: 'auto' }}>
        <div style={{ width: 36, height: 4, background: 'rgba(15,76,129,0.12)', borderRadius: 2, margin: '4px auto 18px' }} />

        {success ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>You&apos;re in!</div>
            <div style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>All reminders activated. Tap any card to set a date.</div>
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
                <img src={getLogoUrl(app.domain)} alt={app.name} width={44} height={44} style={{ borderRadius: 12, objectFit: 'contain', background: '#fff', padding: 4 }} onError={() => setImgError(true)} />
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

            {/* Value prop */}
            <div style={{ fontSize: 14, color: '#475569', fontWeight: 500, lineHeight: 1.5, margin: '14px 0 10px' }}>
              Save your full audit + get reminded before each app charges you again.
            </div>

            {/* Price row */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'linear-gradient(135deg, rgba(15,76,129,0.06) 0%, rgba(45,212,191,0.08) 100%)',
              border: '1px solid rgba(45,212,191,0.2)', borderRadius: 14, padding: '12px 14px', marginBottom: 12,
            }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#0F4C81' }}>
                  ₹49<span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>/account</span>
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>One-time · lifetime access · all apps</div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0d9488', background: 'rgba(13,148,136,0.1)', borderRadius: 100, padding: '4px 10px' }}>
                🔒 Secured
              </div>
            </div>

            <input
              className="gate-input"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ marginBottom: 10 }}
            />

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
              {loading ? 'Processing…' : 'Save + Activate ₹49 →'}
            </button>

            <div style={{ textAlign: 'center', marginTop: 10, fontSize: 13, color: '#475569', fontWeight: 500 }}>
              Already saved?{' '}
              <button onClick={onClose} style={{ color: '#0F4C81', fontWeight: 700, cursor: 'pointer', background: 'none', border: 'none', textDecoration: 'underline', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 13 }}>
                Sign in →
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
