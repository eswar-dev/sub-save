'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuizStore } from '@/lib/store/quizStore'
import { AppResult } from '@/lib/scoring'
import { getLogoUrl, hashColor, formatINR } from '@/lib/data/apps'
import { track } from '@/lib/analytics'
import { formatDate } from '@/lib/utils'
import ReminderConfigSheet from '@/components/sheets/ReminderConfigSheet'

export default function DashboardScreen() {
  const router = useRouter()
  const { results, totalSpend, userEmail, lastAuditDate, sessionId, reminderPaid, reset, retakeWithApps } = useQuizStore()
  const [retakeModalOpen, setRetakeModalOpen] = useState(false)
  const [reminderApp, setReminderApp] = useState<AppResult | null>(null)

  const cancelResults = results.filter((r) => r.verdict === 'cancel')
  const reviewResults = results.filter((r) => r.verdict === 'review')
  const keepResults   = results.filter((r) => r.verdict === 'keep')
  const totalSavings  = cancelResults.reduce((s, r) => s + r.price, 0)

  if (results.length === 0) { router.replace('/'); return null }

  function handleRetakeKeep() {
    setRetakeModalOpen(false)
    retakeWithApps()
    track('retake_keep_apps')
    router.push('/quiz/apps')
  }

  function handleRetakeFresh() {
    setRetakeModalOpen(false)
    reset()
    track('retake_fresh')
    router.push('/quiz/apps')
  }

  return (
    <div className="flex flex-col page-enter" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(150deg,#dbeafe 0%,#e8f4fd 50%,#d4f6ef 100%)' }}>
      {/* Header */}
      <div style={{ flexShrink: 0, padding: '52px 20px 16px', background: 'rgba(255,255,255,0.52)', backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)', borderBottom: '1px solid rgba(255,255,255,0.45)', zIndex: 10 }}>
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, color: '#475569', fontWeight: 600, marginBottom: 2 }}>
            👋 {userEmail}{lastAuditDate ? ` · Last audit: ${formatDate(lastAuditDate)}` : ''}
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#1e293b', letterSpacing: '-0.5px' }}>Your Saved Audit</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'linear-gradient(135deg, rgba(15,76,129,0.07) 0%, rgba(45,212,191,0.11) 100%)', border: '1px solid rgba(45,212,191,0.28)', borderRadius: 14, padding: '10px 14px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>{totalSavings > 0 ? 'Potential monthly savings' : 'Status'}</div>
            {totalSavings > 0 ? (
              <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px', background: 'linear-gradient(135deg, #dc2626 0%, #d97706 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{formatINR(totalSavings)}/month</div>
            ) : (
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0d9488' }}>You&apos;re using everything.</div>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>Total spend</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#1e293b' }}>{formatINR(totalSpend)}/mo</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          {cancelResults.length > 0 && <Chip label={`${cancelResults.length} Cancel`} color="#dc2626" bg="rgba(254,226,226,0.8)" />}
          {reviewResults.length > 0 && <Chip label={`${reviewResults.length} Review`} color="#d97706" bg="rgba(254,243,199,0.8)" />}
          {keepResults.length  > 0 && <Chip label={`${keepResults.length} Keep`}   color="#0d9488" bg="rgba(204,251,241,0.8)" />}
        </div>
      </div>

      {/* Scroll */}
      <div className="scrollbar-hide" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '14px 20px calc(90px + env(safe-area-inset-bottom, 0px))' }}>
          {results.map((result) => (
            <DashboardCard key={result.id} result={result} reminderPaid={reminderPaid} onBell={() => setReminderApp(result)} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px 20px max(20px, env(safe-area-inset-bottom, 20px))', background: 'linear-gradient(to top, rgba(219,234,254,0.96) 62%, transparent)' }}>
        <button onClick={() => setRetakeModalOpen(true)} style={{ width: '100%', height: 50, background: 'rgba(255,255,255,0.62)', border: '1.5px solid rgba(255,255,255,0.5)', borderRadius: 100, fontSize: 14, fontWeight: 700, color: '#0F4C81', cursor: 'pointer', backdropFilter: 'blur(12px)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          🔄 Retake quiz
        </button>
      </div>

      {retakeModalOpen && <RetakeModal onClose={() => setRetakeModalOpen(false)} onKeep={handleRetakeKeep} onFresh={handleRetakeFresh} />}
      {reminderApp && <ReminderConfigSheet app={reminderApp} onClose={() => setReminderApp(null)} />}
    </div>
  )
}

function Chip({ label, color, bg }: { label: string; color: string; bg: string }) {
  return <div style={{ fontSize: 11, fontWeight: 700, padding: '4px 11px', borderRadius: 100, color, background: bg, letterSpacing: '0.02em' }}>{label}</div>
}

function DashboardCard({ result, reminderPaid, onBell }: { result: AppResult; reminderPaid: boolean; onBell: () => void }) {
  const [imgError, setImgError] = useState(false)
  const verdictColors: Record<string, string> = { cancel: '#dc2626', review: '#d97706', keep: '#0d9488' }
  const verdictLabels: Record<string, string> = { cancel: 'CANCEL', review: 'REVIEW', keep: 'KEEP' }
  const cardBg: Record<string, string>     = { cancel: 'rgba(254,226,226,0.72)', review: 'rgba(254,243,199,0.72)', keep: 'rgba(204,251,241,0.72)' }
  const cardBorder: Record<string, string> = { cancel: 'rgba(239,68,68,0.18)', review: 'rgba(245,158,11,0.18)', keep: 'rgba(45,212,191,0.28)' }
  const barBg: Record<string, string>      = { cancel: '#dc2626', review: '#d97706', keep: '#2DD4BF' }

  return (
    <div style={{ borderRadius: 20, overflow: 'hidden', position: 'relative', border: `1.5px solid ${cardBorder[result.verdict]}`, background: cardBg[result.verdict] }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: barBg[result.verdict] }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px 12px 18px', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}>
        {result.custom || imgError ? (
          <div style={{ width: 46, height: 46, borderRadius: 14, background: hashColor(result.id), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: '#fff', flexShrink: 0 }}>{result.name[0]}</div>
        ) : (
          <img src={getLogoUrl(result.domain)} alt={result.name} width={46} height={46}
            style={{ borderRadius: 14, objectFit: 'contain', background: '#fff', padding: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', flexShrink: 0 }}
            onError={() => setImgError(true)}
            onLoad={(e) => { if ((e.currentTarget as HTMLImageElement).naturalWidth < 32) setImgError(true) }}
          />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#1e293b' }}>{result.name}</span>
            <span style={{ fontSize: 10, fontWeight: 800, padding: '4px 9px', borderRadius: 100, background: `${verdictColors[result.verdict]}1a`, color: verdictColors[result.verdict], textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>{verdictLabels[result.verdict]}</span>
          </div>
          <div style={{ fontSize: 12, color: '#475569', fontWeight: 500, marginBottom: 4 }}>₹{result.price}/mo</div>
          <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.4 }}>{result.reason}</div>
          {result.reminderConfig && <div style={{ fontSize: 11, color: '#0d9488', fontWeight: 600, marginTop: 4 }}>🔔 Reminder set</div>}
        </div>
        <button onClick={onBell} style={{ flexShrink: 0, fontSize: 20, background: 'none', border: 'none', cursor: reminderPaid ? 'pointer' : 'default', color: reminderPaid ? '#2DD4BF' : '#94a3b8', padding: 4 }} title={reminderPaid ? 'Set reminder' : 'Save results to enable reminders'}>
          {result.reminderConfig ? '🔔' : '🔕'}
        </button>
      </div>
    </div>
  )
}

function RetakeModal({ onClose, onKeep, onFresh }: { onClose: () => void; onKeep: () => void; onFresh: () => void }) {
  return (
    <>
      <div className="b-overlay open" onClick={onClose} />
      <div className="b-sheet open">
        <div style={{ width: 36, height: 4, background: 'rgba(15,76,129,0.12)', borderRadius: 2, margin: '4px auto 20px' }} />
        <div style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', marginBottom: 6 }}>How do you want to retake?</div>
        <div style={{ fontSize: 13, color: '#475569', fontWeight: 500, marginBottom: 20 }}>Your previous audit stays saved either way.</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={onKeep} style={{ textAlign: 'left', background: 'linear-gradient(135deg, rgba(15,76,129,0.06) 0%, rgba(45,212,191,0.08) 100%)', border: '1.5px solid rgba(45,212,191,0.25)', borderRadius: 16, padding: '16px 18px', cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#1e293b', marginBottom: 2 }}>Keep my apps</div>
            <div style={{ fontSize: 11, color: '#475569', fontWeight: 500 }}>Pre-fill your previous selections — just re-answer the questions</div>
          </button>
          <button onClick={onFresh} style={{ textAlign: 'left', background: 'rgba(255,255,255,0.7)', border: '1.5px solid rgba(15,76,129,0.1)', borderRadius: 16, padding: '16px 18px', cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#1e293b', marginBottom: 2 }}>Start fresh</div>
            <div style={{ fontSize: 11, color: '#475569', fontWeight: 500 }}>Clear everything and pick new apps from scratch</div>
          </button>
        </div>
      </div>
    </>
  )
}
