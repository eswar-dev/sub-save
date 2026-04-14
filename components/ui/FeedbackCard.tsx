'use client'

import { useState } from 'react'
import { track } from '@/lib/analytics'

interface Props {
  sessionId: string | null
}

export default function FeedbackCard({ sessionId }: Props) {
  const [decision, setDecision] = useState<'yes' | 'maybe' | 'no' | null>(null)
  const [rating, setRating] = useState(0)
  const [text, setText] = useState('')
  const [recommend, setRecommend] = useState<'yes' | 'no' | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [skipped, setSkipped] = useState(false)

  if (submitted || skipped) return null

  async function handleSubmit() {
    const meta = { decision, rating, text: text.trim() || null, recommend }
    track('feedback_submitted', { decision, rating, has_text: !!text.trim(), recommend })
    if (sessionId) {
      fetch(`/api/sessions/${sessionId}/feedback`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback_meta: meta }),
      }).catch(() => {})
    }
    setSubmitted(true)
  }

  function handleSkip() {
    track('feedback_skipped')
    setSkipped(true)
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.68)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      border: '1.5px solid rgba(255,255,255,0.55)', borderRadius: 22,
      padding: '20px 18px',
      boxShadow: '0 4px 24px rgba(15,76,129,0.08), inset 0 1px 0 rgba(255,255,255,0.7)',
      marginTop: 8,
    }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: '#1e293b', marginBottom: 16 }}>Quick question</div>

      {/* Q1: Decision */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: '#475569', fontWeight: 600, marginBottom: 8 }}>Did this help you make a decision?</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ v: 'yes' as const, label: '✅ Yes' }, { v: 'maybe' as const, label: '🤷 Maybe' }, { v: 'no' as const, label: '❌ No' }].map((opt) => (
            <button
              key={opt.v}
              onClick={() => setDecision(opt.v)}
              style={{
                flex: 1, height: 38, borderRadius: 100,
                border: `1.5px solid ${decision === opt.v ? '#2DD4BF' : 'rgba(15,76,129,0.12)'}`,
                background: decision === opt.v ? 'rgba(45,212,191,0.15)' : 'rgba(255,255,255,0.6)',
                fontSize: 12, fontWeight: 700, color: decision === opt.v ? '#0d9488' : '#475569',
                cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Q2: Rating */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: '#475569', fontWeight: 600, marginBottom: 8 }}>Rate your experience</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              style={{ fontSize: 24, background: 'none', border: 'none', cursor: 'pointer', filter: star <= rating ? 'none' : 'grayscale(1)', opacity: star <= rating ? 1 : 0.4, transition: 'all 0.15s' }}
            >
              ⭐
            </button>
          ))}
        </div>
      </div>

      {/* Q3: Text */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: '#475569', fontWeight: 600, marginBottom: 8 }}>What would make this better? <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span></div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Tell us anything…"
          style={{
            width: '100%', minHeight: 72, padding: '12px 14px', resize: 'none',
            background: 'rgba(255,255,255,0.7)', border: '1.5px solid rgba(15,76,129,0.12)', borderRadius: 14,
            fontSize: 14, color: '#1e293b', fontFamily: 'Plus Jakarta Sans, sans-serif', outline: 'none',
          }}
        />
      </div>

      {/* Q4: Recommend */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 12, color: '#475569', fontWeight: 600, marginBottom: 8 }}>Would you recommend this?</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ v: 'yes' as const, label: '👍 Yes' }, { v: 'no' as const, label: '👎 No' }].map((opt) => (
            <button
              key={opt.v}
              onClick={() => setRecommend(opt.v)}
              style={{
                flex: 1, height: 38, borderRadius: 100,
                border: `1.5px solid ${recommend === opt.v ? '#2DD4BF' : 'rgba(15,76,129,0.12)'}`,
                background: recommend === opt.v ? 'rgba(45,212,191,0.15)' : 'rgba(255,255,255,0.6)',
                fontSize: 13, fontWeight: 700, color: recommend === opt.v ? '#0d9488' : '#475569',
                cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={handleSkip} style={{
          flex: 1, height: 42, background: 'rgba(255,255,255,0.6)', border: '1.5px solid rgba(15,76,129,0.12)',
          borderRadius: 100, fontSize: 13, fontWeight: 700, color: '#475569', cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
        }}>
          Skip →
        </button>
        <button
          onClick={handleSubmit}
          disabled={!decision}
          style={{
            flex: 2, height: 42,
            background: decision ? 'linear-gradient(135deg, #0F4C81 0%, #2DD4BF 100%)' : 'rgba(148,163,184,0.3)',
            color: decision ? '#fff' : '#94a3b8', border: 'none', borderRadius: 100,
            fontSize: 13, fontWeight: 700, cursor: decision ? 'pointer' : 'default', fontFamily: 'Plus Jakarta Sans, sans-serif',
          }}
        >
          Submit
        </button>
      </div>
    </div>
  )
}
