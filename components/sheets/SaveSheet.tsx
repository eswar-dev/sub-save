'use client'

import { useState } from 'react'
import { useQuizStore, getLocalSessionId } from '@/lib/store/quizStore'
import { track } from '@/lib/analytics'

interface Props {
  open: boolean
  onClose: () => void
}

type Step = 'email' | 'otp' | 'success'

export default function SaveSheet({ open, onClose }: Props) {
  const { setReminderPaid } = useQuizStore()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSendOTP() {
    if (!email.includes('@') || loading) return
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) throw new Error()
      setStep('otp')
      track('otp_sent', { source: 'save_sheet' })
    } catch { setError('Could not send code. Try again.') }
    setLoading(false)
  }

  async function handleVerifyOTP() {
    if (code.length !== 6 || loading) return
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, local_session_id: getLocalSessionId() }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) { setError(data.error === 'Code expired' ? 'Code expired — go back and resend.' : 'Wrong code. Try again.'); setLoading(false); return }
      setReminderPaid(email)
      track('email_captured', { source: 'save_sheet' })
      setStep('success')
      setTimeout(onClose, 2000)
    } catch { setError('Something went wrong. Try again.') }
    setLoading(false)
  }

  function handleClose() { setStep('email'); setCode(''); setError(''); onClose() }

  if (!open) return null

  return (
    <>
      <div className="b-overlay open" onClick={handleClose} />
      <div className="b-sheet open">
        <div style={{ width: 36, height: 4, background: 'rgba(15,76,129,0.12)', borderRadius: 2, margin: '4px auto 18px' }} />

        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>Results saved!</div>
            <div style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>Reminders active. Tap any 🔔 to set a renewal date.</div>
          </div>
        )}

        {step === 'otp' && (
          <>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#1e293b', marginBottom: 4 }}>Check your email</div>
            <div style={{ fontSize: 13, color: '#475569', fontWeight: 500, marginBottom: 20, lineHeight: 1.5 }}>
              We sent a 6-digit code to <strong>{email}</strong>
            </div>
            <input className="gate-input" type="text" inputMode="numeric" maxLength={6} placeholder="000000"
              value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} autoFocus
              style={{ marginBottom: 12, textAlign: 'center', letterSpacing: '0.3em', fontSize: 24, fontWeight: 800 }}
            />
            {error && <div style={{ fontSize: 12, color: '#dc2626', marginBottom: 10, fontWeight: 500 }}>{error}</div>}
            <button onClick={handleVerifyOTP} disabled={code.length !== 6 || loading} style={{
              width: '100%', height: 50,
              background: code.length === 6 ? 'linear-gradient(135deg, #0F4C81 0%, #2DD4BF 100%)' : 'rgba(148,163,184,0.3)',
              color: code.length === 6 ? '#fff' : '#94a3b8', border: 'none', borderRadius: 100,
              fontSize: 15, fontWeight: 700, cursor: code.length === 6 ? 'pointer' : 'default', fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}>{loading ? 'Verifying…' : 'Verify →'}</button>
            <button onClick={() => { setStep('email'); setCode(''); setError('') }}
              style={{ marginTop: 12, width: '100%', background: 'none', border: 'none', fontSize: 13, color: '#94a3b8', cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              ← Change email
            </button>
          </>
        )}

        {step === 'email' && (
          <>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#1e293b', marginBottom: 4 }}>Don&apos;t lose this</div>
            <div style={{ fontSize: 13, color: '#475569', fontWeight: 500, marginBottom: 6, lineHeight: 1.5 }}>Save your results and get reminded before renewals — free.</div>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500, marginBottom: 18, lineHeight: 1.5 }}>
              We&apos;ll remind you before renewal · Track what you cancel · See if you actually saved money
            </div>
            <input className="gate-input" type="email" placeholder="your@gmail.com" value={email}
              onChange={(e) => setEmail(e.target.value)} style={{ marginBottom: 12 }} />
            {error && <div style={{ fontSize: 12, color: '#dc2626', marginBottom: 10, fontWeight: 500 }}>{error}</div>}
            <button onClick={handleSendOTP} disabled={!email.includes('@') || loading} style={{
              width: '100%', height: 50,
              background: email.includes('@') ? 'linear-gradient(135deg, #0F4C81 0%, #2DD4BF 100%)' : 'rgba(148,163,184,0.3)',
              color: email.includes('@') ? '#fff' : '#94a3b8', border: 'none', borderRadius: 100,
              fontSize: 15, fontWeight: 700, cursor: email.includes('@') ? 'pointer' : 'default', fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}>{loading ? 'Sending code…' : 'Save this →'}</button>
            <p style={{ textAlign: 'center', marginTop: 12, fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>No spam. Just renewal reminders.</p>
          </>
        )}
      </div>
    </>
  )
}
