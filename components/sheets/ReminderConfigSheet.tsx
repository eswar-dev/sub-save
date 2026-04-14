'use client'

import { useState } from 'react'
import { useQuizStore } from '@/lib/store/quizStore'
import { AppResult, ReminderConfig } from '@/lib/scoring'
import { getLogoUrl, hashColor } from '@/lib/data/apps'
import { track } from '@/lib/analytics'

type Mode = 'exact' | 'estimated' | 'monthly'

interface Props {
  app: AppResult
  onClose: () => void
}

export default function ReminderConfigSheet({ app, onClose }: Props) {
  const { updateReminderConfig, sessionId } = useQuizStore()
  const [mode, setMode] = useState<Mode | null>(null)
  const [date, setDate] = useState('')
  const [week, setWeek] = useState('')
  const [reviewDay, setReviewDay] = useState('25th')
  const [leadDays, setLeadDays] = useState([7, 3, 1])
  const [confirmed, setConfirmed] = useState(false)
  const [imgError, setImgError] = useState(false)

  function toggleLeadDay(d: number) {
    setLeadDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d])
  }

  async function handleConfirm() {
    const config: ReminderConfig = { mode: mode! }
    if (mode === 'exact') { config.date = date; config.leadDays = leadDays }
    if (mode === 'estimated') { config.week = week }
    if (mode === 'monthly') { config.reviewDay = reviewDay }

    updateReminderConfig(app.id, config)
    track('reminder_set', { app_id: app.id, mode: mode! })

    // Save to DB if we have session
    if (sessionId) {
      fetch(`/api/sessions/${sessionId}/reminder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_id: app.id, reminder_config: config }),
      }).catch(() => {})
    }

    setConfirmed(true)
  }

  const canConfirm = mode === 'exact' ? !!date : mode === 'estimated' ? !!week : mode === 'monthly'

  return (
    <>
      <div className="b-overlay open" onClick={onClose} />
      <div className="b-sheet open" style={{ overflowY: 'auto', maxHeight: '85%' }}>
        <div style={{ width: 36, height: 4, background: 'rgba(15,76,129,0.12)', borderRadius: 2, margin: '4px auto 18px' }} />

        {/* App header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          {app.custom || imgError ? (
            <div style={{ width: 44, height: 44, borderRadius: 12, background: hashColor(app.id), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: '#fff', flexShrink: 0 }}>{app.name[0]}</div>
          ) : (
            <img src={getLogoUrl(app.domain)} alt={app.name} width={44} height={44} style={{ borderRadius: 12, objectFit: 'contain', background: '#fff', padding: 4 }} onError={() => setImgError(true)} />
          )}
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#1e293b' }}>{app.name}</div>
            <div style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>₹{app.price}/mo</div>
          </div>
        </div>

        {confirmed ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>🔔</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#1e293b', marginBottom: 6 }}>Reminder set!</div>
            <div style={{ fontSize: 13, color: '#475569', fontWeight: 500, marginBottom: 20 }}>
              {mode === 'exact' && date && `Reminding you ${leadDays.sort((a, b) => b - a).join(', ')} days before ${new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
              {mode === 'estimated' && week && `Reminding you the week before the ${week} week of the month`}
              {mode === 'monthly' && `Monthly review on the ${reviewDay} of each month`}
            </div>
            <button onClick={onClose} style={{ height: 46, padding: '0 28px', background: 'linear-gradient(135deg, #0F4C81 0%, #2DD4BF 100%)', color: '#fff', border: 'none', borderRadius: 100, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Done</button>
          </div>
        ) : (
          <>
            {!mode && (
              <>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Do you know when this renews?</div>
                {[
                  { id: 'exact' as Mode, icon: '📅', title: 'Yes, I know the date', desc: 'Set a precise renewal reminder' },
                  { id: 'estimated' as Mode, icon: '🤔', title: 'Roughly', desc: 'Pick the week of month it usually renews' },
                  { id: 'monthly' as Mode, icon: '🔁', title: 'No idea', desc: 'Get a monthly review reminder instead' },
                ].map((opt) => (
                  <div
                    key={opt.id}
                    onClick={() => setMode(opt.id)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 0',
                      borderBottom: '1px solid rgba(15,76,129,0.06)', cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: 24 }}>{opt.icon}</span>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>{opt.title}</div>
                      <div style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>{opt.desc}</div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {mode === 'exact' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>When does it renew?</div>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="gate-input" />
                <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Remind me</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[7, 3, 1].map((d) => (
                    <button key={d} onClick={() => toggleLeadDay(d)} style={{
                      padding: '8px 14px', borderRadius: 100, border: `1.5px solid ${leadDays.includes(d) ? '#2DD4BF' : 'rgba(15,76,129,0.15)'}`,
                      background: leadDays.includes(d) ? 'rgba(45,212,191,0.15)' : 'rgba(255,255,255,0.6)',
                      fontSize: 13, fontWeight: 700, color: leadDays.includes(d) ? '#0d9488' : '#475569', cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
                    }}>{d} day{d !== 1 ? 's' : ''} before</button>
                  ))}
                </div>
              </div>
            )}

            {mode === 'estimated' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Which week does it usually renew?</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['1st', '2nd', '3rd', '4th'].map((w, i) => (
                    <button key={w} onClick={() => setWeek(w)} style={{
                      padding: '8px 14px', borderRadius: 100, border: `1.5px solid ${week === w ? '#2DD4BF' : 'rgba(15,76,129,0.15)'}`,
                      background: week === w ? 'rgba(45,212,191,0.15)' : 'rgba(255,255,255,0.6)',
                      fontSize: 13, fontWeight: 700, color: week === w ? '#0d9488' : '#475569', cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
                    }}>{i === 3 ? 'Last week' : `${w} week`}</button>
                  ))}
                </div>
              </div>
            )}

            {mode === 'monthly' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ fontSize: 13, color: '#475569', fontWeight: 500, lineHeight: 1.4 }}>
                  We&apos;ll ping you every month to check if it&apos;s still worth it
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Preferred day</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['1st', '15th', '25th'].map((d) => (
                    <button key={d} onClick={() => setReviewDay(d)} style={{
                      padding: '8px 14px', borderRadius: 100, border: `1.5px solid ${reviewDay === d ? '#2DD4BF' : 'rgba(15,76,129,0.15)'}`,
                      background: reviewDay === d ? 'rgba(45,212,191,0.15)' : 'rgba(255,255,255,0.6)',
                      fontSize: 13, fontWeight: 700, color: reviewDay === d ? '#0d9488' : '#475569', cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
                    }}>{d === '1st' ? '1st of month' : d}</button>
                  ))}
                </div>
              </div>
            )}

            {mode && (
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={() => setMode(null)} style={{ height: 46, padding: '0 20px', background: 'rgba(255,255,255,0.6)', border: '1.5px solid rgba(15,76,129,0.15)', borderRadius: 100, fontSize: 14, fontWeight: 700, color: '#475569', cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>← Back</button>
                <button
                  onClick={handleConfirm}
                  disabled={!canConfirm}
                  style={{
                    flex: 1, height: 46,
                    background: canConfirm ? 'linear-gradient(135deg, #0F4C81 0%, #2DD4BF 100%)' : 'rgba(148,163,184,0.3)',
                    color: canConfirm ? '#fff' : '#94a3b8', border: 'none', borderRadius: 100,
                    fontSize: 14, fontWeight: 700, cursor: canConfirm ? 'pointer' : 'default', fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}
                >
                  Set reminder →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
