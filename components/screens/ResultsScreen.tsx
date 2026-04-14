'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuizStore, getLocalSessionId } from '@/lib/store/quizStore'
import { AppResult } from '@/lib/scoring'
import { getLogoUrl, hashColor, formatINR } from '@/lib/data/apps'
import { track } from '@/lib/analytics'
import { formatDate } from '@/lib/utils'
import FeedbackCard from '@/components/ui/FeedbackCard'
import ReminderGateSheet from '@/components/sheets/ReminderGateSheet'
import ReminderConfigSheet from '@/components/sheets/ReminderConfigSheet'
import SignInSheet from '@/components/sheets/SignInSheet'

export default function ResultsScreen() {
  const router = useRouter()
  const { results, totalSpend, sessionId, reminderPaid, userEmail, lastAuditDate, isReturningUser, resetAnswers } = useQuizStore()
  const [gateApp, setGateApp] = useState<AppResult | null>(null)
  const [reminderApp, setReminderApp] = useState<AppResult | null>(null)
  const [disagreeApp, setDisagreeApp] = useState<AppResult | null>(null)
  const [signinOpen, setSigninOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)

  const cancelResults = results.filter((r) => r.verdict === 'cancel')
  const reviewResults = results.filter((r) => r.verdict === 'review')
  const keepResults = results.filter((r) => r.verdict === 'keep')
  const totalSavings = cancelResults.reduce((s, r) => s + r.price, 0)

  // Feedback modal — show after 12s if not already done
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem('sps_feedback_done') === '1') return
    const t = setTimeout(() => setFeedbackOpen(true), 12000)
    return () => clearTimeout(t)
  }, [])

  // Save session to DB — once on mount
  useEffect(() => {
    if (results.length === 0 || sessionId) return
    fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: getLocalSessionId(),
        apps_selected: results,
        total_spend: totalSpend,
        total_savings: totalSavings,
        email: userEmail ?? localStorage.getItem('sps_email') ?? undefined,
      }),
    })
      .then((r) => r.json())
      .then((data) => { if (data.id) useQuizStore.getState().setSession(data.id) })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Category overlap detection
  const catCounts: Record<string, number> = {}
  results.forEach((r) => { catCounts[r.category] = (catCounts[r.category] ?? 0) + 1 })
  const overlapCat = Object.entries(catCounts).find(([, c]) => c >= 2)

  function handleBellTap(app: AppResult) {
    track('bell_tapped', { app_id: app.id })
    if (reminderPaid) {
      setReminderApp(app)
    } else {
      setGateApp(app)
    }
  }

  async function handleShare() {
    const url = typeof window !== 'undefined' ? window.location.host : 'subpaysaver.app'
    const text = `I just found out I could save ${formatINR(totalSavings)}/month on subscriptions! Check yours at ${url} 🔔\n\nMy audit: ${cancelResults.map((r) => `❌ ${r.name}`).join(', ')}`
    track('share_clicked', { method: 'native' })
    if (navigator.share) {
      try { await navigator.share({ text, title: 'SUB PAY SAVER — My Subscription Audit' }) } catch {}
    } else {
      handleCopy()
    }
  }

  function handleCopy() {
    const text = `My SUB PAY SAVER audit:\n${results.map((r) => `${r.verdict === 'cancel' ? '❌' : r.verdict === 'review' ? '⚠️' : '✅'} ${r.name} — ₹${r.price}/mo`).join('\n')}\n\nCould save: ${formatINR(totalSavings)}/month`
    navigator.clipboard?.writeText(text).catch(() => {})
    track('share_clicked', { method: 'copy' })
  }

  if (results.length === 0) return null

  return (
    <div
      className="flex flex-col page-enter"
      style={{ position: 'absolute', inset: 0, background: 'linear-gradient(150deg,#dbeafe 0%,#e8f4fd 50%,#d4f6ef 100%)' }}
    >
      {/* Sticky header */}
      <div style={{
        flexShrink: 0, padding: '52px 20px 16px',
        background: 'rgba(255,255,255,0.52)', backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)',
        borderBottom: '1px solid rgba(255,255,255,0.45)',
        zIndex: 10,
      }}>
        {/* Back button on its own row */}
        <button
          onClick={() => router.push('/quiz/apps')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.45)',
            color: '#475569', fontSize: 12, fontWeight: 600,
            padding: '6px 12px', borderRadius: 100, cursor: 'pointer',
            backdropFilter: 'blur(10px)', fontFamily: 'Plus Jakarta Sans, sans-serif',
            marginBottom: 10,
          }}
        >
          ‹ Edit apps
        </button>

        {/* Title row */}
        <div style={{ marginBottom: 10 }}>
          {isReturningUser && lastAuditDate && (
            <div style={{ fontSize: 11, color: '#475569', fontWeight: 600, marginBottom: 2 }}>
              Welcome back 👋 · Last audit: {formatDate(lastAuditDate)}
            </div>
          )}
          <div style={{ fontSize: 22, fontWeight: 900, color: '#1e293b', letterSpacing: '-0.5px' }}>
            Your Audit
          </div>
        </div>

        {/* Savings banner */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'linear-gradient(135deg, rgba(15,76,129,0.07) 0%, rgba(45,212,191,0.11) 100%)',
          border: '1px solid rgba(45,212,191,0.28)', borderRadius: 14,
          padding: '10px 14px',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
              {totalSavings > 0 ? 'You could save' : 'Great news!'}
            </div>
            {totalSavings > 0 ? (
              <div style={{
                fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px',
                background: 'linear-gradient(135deg, #dc2626 0%, #d97706 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                {formatINR(totalSavings)}/month
              </div>
            ) : (
              <div style={{ fontSize: 18, fontWeight: 900, color: '#0d9488', letterSpacing: '-0.3px' }}>
                You&apos;re using everything you pay for.
              </div>
            )}
            {totalSavings > 0 && (
              <div style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8' }}>by cancelling marked apps</div>
            )}
          </div>
        </div>

        {/* Count chips */}
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          {cancelResults.length > 0 && <Chip label={`${cancelResults.length} Cancel`} color="#dc2626" bg="rgba(254,226,226,0.8)" />}
          {reviewResults.length > 0 && <Chip label={`${reviewResults.length} Review`} color="#d97706" bg="rgba(254,243,199,0.8)" />}
          {keepResults.length > 0 && <Chip label={`${keepResults.length} Keep`} color="#0d9488" bg="rgba(204,251,241,0.8)" />}
        </div>
      </div>

      {/* Scroll area — plain block so flex doesn't shrink children */}
      <div className="scrollbar-hide" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '14px 20px calc(90px + env(safe-area-inset-bottom, 0px))' }}>

          {/* Category overlap insight */}
          {overlapCat && (
            <div style={{
              background: 'rgba(254,243,199,0.72)', border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: 18, padding: '14px 16px',
              display: 'flex', alignItems: 'flex-start', gap: 10,
            }}>
              <span style={{ fontSize: 20 }}>⚡</span>
              <div style={{ fontSize: 13, color: '#92400e', fontWeight: 500, lineHeight: 1.4 }}>
                You have <strong>{catCounts[overlapCat[0]]}</strong> {overlapCat[0]} subscriptions. Most users actively use only 1–2.
              </div>
            </div>
          )}

          {/* Verdict cards */}
          {results.map((result) => (
            <VerdictCard
              key={result.id}
              result={result}
              reminderPaid={reminderPaid}
              onBell={() => handleBellTap(result)}
              onDisagree={() => setDisagreeApp(result)}
            />
          ))}

          {/* Family plan disclaimer */}
          <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', fontWeight: 500, marginTop: 4 }}>
            Prices shown are full plan cost. If you share with family, your actual savings are even higher.
          </div>

        </div>
      </div>

      {/* Footer: Share + Copy */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '14px 20px max(20px, env(safe-area-inset-bottom, 20px))',
        background: 'linear-gradient(to top, rgba(219,234,254,0.96) 62%, transparent)',
      }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleShare} style={shareButtonStyle}>📤 Share</button>
          <button onClick={handleCopy} style={shareButtonStyle}>📋 Copy</button>
        </div>
      </div>

      {/* Reminder gate */}
      {gateApp && (
        <ReminderGateSheet
          app={gateApp}
          onClose={() => setGateApp(null)}
          onSuccess={() => { setGateApp(null); setReminderApp(gateApp) }}
          onSignIn={() => setSigninOpen(true)}
        />
      )}

      {/* Sign-in sheet (from gate link) */}
      <SignInSheet open={signinOpen} onClose={() => setSigninOpen(false)} />

      {/* Reminder config */}
      {reminderApp && (
        <ReminderConfigSheet
          app={reminderApp}
          onClose={() => setReminderApp(null)}
        />
      )}

      {/* Disagree sheet */}
      {disagreeApp && (
        <DisagreeSheet app={disagreeApp} onClose={() => setDisagreeApp(null)} />
      )}

      {/* Feedback modal — timed popup */}
      <FeedbackCard
        sessionId={sessionId}
        asModal
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
      />
    </div>
  )
}

const shareButtonStyle: React.CSSProperties = {
  flex: 1, height: 46,
  background: 'rgba(255,255,255,0.62)', border: '1.5px solid rgba(255,255,255,0.5)',
  borderRadius: 100, fontSize: 13, fontWeight: 700, color: '#0F4C81',
  cursor: 'pointer', backdropFilter: 'blur(12px)',
  fontFamily: 'Plus Jakarta Sans, sans-serif',
}

function Chip({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, padding: '4px 11px',
      borderRadius: 100, color, background: bg, letterSpacing: '0.02em',
    }}>
      {label}
    </div>
  )
}

function VerdictCard({ result, reminderPaid, onBell, onDisagree }: {
  result: AppResult
  reminderPaid: boolean
  onBell: () => void
  onDisagree: () => void
}) {
  const [imgError, setImgError] = useState(false)
  const [thumbed, setThumbed] = useState<'up' | 'down' | null>(null)

  const verdictColors: Record<string, string> = { cancel: '#dc2626', review: '#d97706', keep: '#0d9488' }
  const verdictLabels: Record<string, string> = { cancel: 'CANCEL', review: 'REVIEW', keep: 'KEEP' }
  const tagBg: Record<string, string> = {
    cancel: 'rgba(239,68,68,0.14)',
    review: 'rgba(245,158,11,0.14)',
    keep: 'rgba(45,212,191,0.18)',
  }
  const cardBg: Record<string, string> = {
    cancel: 'rgba(254,226,226,0.72)',
    review: 'rgba(254,243,199,0.72)',
    keep: 'rgba(204,251,241,0.72)',
  }
  const cardBorder: Record<string, string> = {
    cancel: 'rgba(239,68,68,0.18)',
    review: 'rgba(245,158,11,0.18)',
    keep: 'rgba(45,212,191,0.28)',
  }
  const barBg: Record<string, string> = {
    cancel: '#dc2626',
    review: '#d97706',
    keep: '#2DD4BF',
  }

  function handleThumb(type: 'up' | 'down') {
    setThumbed(type)
    track(type === 'up' ? 'verdict_agreed' : 'verdict_disagreed', { app_id: result.id, verdict: result.verdict })
    if (type === 'down') onDisagree()
  }

  return (
    <div
      style={{
        borderRadius: 20, overflow: 'hidden', position: 'relative',
        border: `1.5px solid ${cardBorder[result.verdict]}`,
        background: cardBg[result.verdict],
      }}
    >
      {/* Colored left bar */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
        background: barBg[result.verdict],
      }} />

      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px 12px 18px',
        backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
      }}>
        {/* Logo */}
        {result.custom || imgError ? (
          <div style={{
            width: 46, height: 46, borderRadius: 14,
            background: hashColor(result.id),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 900, color: '#fff', flexShrink: 0,
          }}>
            {result.name[0]}
          </div>
        ) : (
          <img
            src={getLogoUrl(result.domain)}
            alt={result.name}
            width={46} height={46}
            style={{ borderRadius: 14, objectFit: 'contain', background: '#fff', padding: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', flexShrink: 0 }}
            onError={() => setImgError(true)}
                            onLoad={(e) => { if ((e.currentTarget as HTMLImageElement).naturalWidth < 32) setImgError(true) }}
          />
        )}

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#1e293b' }}>{result.name}</span>
            <span style={{
              fontSize: 10, fontWeight: 800, padding: '4px 9px', borderRadius: 100,
              background: tagBg[result.verdict], color: verdictColors[result.verdict],
              textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0,
            }}>
              {verdictLabels[result.verdict]}
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#475569', fontWeight: 500, marginBottom: 4 }}>₹{result.price}/mo</div>
          <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.4 }}>{result.reason}</div>

          {/* Thumbs */}
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <button
              onClick={() => handleThumb('up')}
              style={{
                fontSize: 14, background: thumbed === 'up' ? 'rgba(45,212,191,0.2)' : 'rgba(255,255,255,0.5)',
                border: `1px solid ${thumbed === 'up' ? '#2DD4BF' : 'rgba(255,255,255,0.6)'}`,
                borderRadius: 100, padding: '4px 10px', cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >👍</button>
            <button
              onClick={() => handleThumb('down')}
              style={{
                fontSize: 14, background: thumbed === 'down' ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.5)',
                border: `1px solid ${thumbed === 'down' ? '#dc2626' : 'rgba(255,255,255,0.6)'}`,
                borderRadius: 100, padding: '4px 10px', cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >👎</button>
          </div>
        </div>

        {/* Bell */}
        <button
          onClick={onBell}
          style={{
            flexShrink: 0, fontSize: 20, background: 'none', border: 'none', cursor: 'pointer',
            filter: (result.reminderConfig || reminderPaid) ? 'none' : 'grayscale(0.3)',
            color: reminderPaid ? '#2DD4BF' : '#94a3b8',
            padding: 4,
          }}
          title="Set reminder"
        >
          {result.reminderConfig ? '🔔' : '🔕'}
        </button>
      </div>
    </div>
  )
}

function DisagreeSheet({ app, onClose }: { app: AppResult; onClose: () => void }) {
  const reasons = ['I use it more than I said', 'I share it with family', 'It\'s seasonal / occasional', 'The price shown is wrong', 'I just subscribed']

  return (
    <>
      <div className="b-overlay open" onClick={onClose} />
      <div className="b-sheet open">
        <div style={{ width: 36, height: 4, background: 'rgba(15,76,129,0.12)', borderRadius: 2, margin: '4px auto 18px' }} />
        <div style={{ fontSize: 17, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>Why don&apos;t you agree?</div>
        <div style={{ fontSize: 12, color: '#475569', marginBottom: 16, fontWeight: 500 }}>Help us improve {app.name}&apos;s verdict</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {reasons.map((r) => (
            <button
              key={r}
              onClick={() => {
                track('verdict_disagreed', { app_id: app.id, verdict: app.verdict, reason: r })
                onClose()
              }}
              style={{
                textAlign: 'left', background: 'rgba(255,255,255,0.7)', border: '1.5px solid rgba(15,76,129,0.1)',
                borderRadius: 14, padding: '14px 16px', fontSize: 14, color: '#1e293b', fontWeight: 500,
                cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
