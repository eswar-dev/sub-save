'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const ADMIN_EMAILS = ['eswar@gmail.com']

interface Session {
  id: string
  email: string | null
  total_spend: number
  total_savings: number
  apps_selected: { name: string; verdict: string }[]
  created_at: string
}

interface AdminMetrics {
  summary: {
    total_sessions: number
    unique_users: number
    avg_savings: number
    avg_spend: number
  }
  top_apps_selected: { name: string; count: number }[]
  top_apps_cancelled: { name: string; count: number }[]
  sessions: Session[]
}

interface FunnelStep {
  label: string
  event: string
  count: number
  unique_users: number
}

interface PostHogMetrics {
  funnel: FunnelStep[]
  extras: {
    bell_tapped: number
    payment_completed: number
    reminder_set: number
    signin_attempted: number
  }
}

function formatINR(n: number) {
  return `₹${n.toLocaleString('en-IN')}`
}

function pct(a: number, b: number) {
  if (!b) return '—'
  return `${Math.round((a / b) * 100)}%`
}

export default function AdminPage() {
  const router = useRouter()
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
  const [phMetrics, setPhMetrics] = useState<PostHogMetrics | null>(null)
  const [phError, setPhError] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [adminEmail, setAdminEmail] = useState('')

  useEffect(() => {
    const email = typeof window !== 'undefined' ? localStorage.getItem('sps_email') ?? '' : ''
    if (!ADMIN_EMAILS.includes(email)) { router.replace('/'); return }
    setAdminEmail(email)

    const headers = { 'x-admin-email': email }

    Promise.all([
      fetch('/api/admin/metrics', { headers }).then((r) => r.json()),
      fetch('/api/admin/posthog-metrics', { headers }).then((r) => r.json()),
    ]).then(([supaData, phData]) => {
      if (supaData.error) { setError(supaData.error) }
      else setMetrics(supaData)

      if (phData.error) setPhError(phData.error)
      else setPhMetrics(phData)

      setLoading(false)
    }).catch(() => { setError('Failed to load metrics'); setLoading(false) })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const F = { fontFamily: 'Plus Jakarta Sans, -apple-system, sans-serif' }

  const card: React.CSSProperties = {
    background: 'rgba(255,255,255,0.72)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: 16,
    padding: '16px 14px',
    border: '1px solid rgba(255,255,255,0.5)',
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', ...F }}>
      <div style={{ color: '#475569', fontSize: 15, fontWeight: 500 }}>Loading…</div>
    </div>
  )

  if (error || !metrics) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', ...F }}>
      <div style={{ color: '#dc2626', fontSize: 15, fontWeight: 500 }}>{error || 'No data'}</div>
    </div>
  )

  const top = phMetrics?.funnel[0]?.count ?? 0

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(150deg, #dbeafe 0%, #e8f4fd 45%, #d4f6ef 100%)', ...F, padding: '24px 16px 64px' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#1e293b' }}>Admin Dashboard</div>
        <div style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>{adminEmail}</div>
      </div>

      {/* ── Supabase summary ── */}
      <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Supabase — Sessions</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Total Sessions', value: String(metrics.summary.total_sessions) },
          { label: 'Unique Users', value: String(metrics.summary.unique_users) },
          { label: 'Avg Savings/mo', value: formatINR(metrics.summary.avg_savings) },
          { label: 'Avg Spend/mo', value: formatINR(metrics.summary.avg_spend) },
        ].map(({ label, value }) => (
          <div key={label} style={card}>
            <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#1e293b' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* ── PostHog funnel ── */}
      <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
        PostHog — Funnel (last 30 days)
      </div>

      {phError ? (
        <div style={{ ...card, marginBottom: 20, color: '#d97706', fontSize: 13, fontWeight: 500 }}>
          ⚠️ {phError} — set POSTHOG_PERSONAL_API_KEY + POSTHOG_PROJECT_ID in .env.local
        </div>
      ) : phMetrics ? (
        <>
          <div style={{ ...card, marginBottom: 10 }}>
            {phMetrics.funnel.map((step, i) => {
              const dropPct = i === 0 ? null : pct(step.count, phMetrics.funnel[i - 1].count)
              const barW = top > 0 ? Math.round((step.count / top) * 100) : 0
              return (
                <div key={step.event} style={{ marginBottom: i < phMetrics.funnel.length - 1 ? 16 : 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{step.label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {dropPct && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#dc2626' }}>↓ {dropPct}</span>
                      )}
                      <span style={{ fontSize: 15, fontWeight: 900, color: '#0F4C81' }}>{step.count.toLocaleString()}</span>
                    </div>
                  </div>
                  <div style={{ height: 6, background: 'rgba(15,76,129,0.08)', borderRadius: 99 }}>
                    <div style={{
                      height: 6, borderRadius: 99, width: `${barW}%`,
                      background: i === 0 ? '#0F4C81' : i === 1 ? '#2563eb' : i === 2 ? '#2DD4BF' : '#0d9488',
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Extras row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 20 }}>
            {[
              { label: '🔔 Bell tapped', value: phMetrics.extras.bell_tapped },
              { label: '💳 Payments', value: phMetrics.extras.payment_completed },
              { label: '⏰ Reminders set', value: phMetrics.extras.reminder_set },
              { label: '🔑 Sign-in attempts', value: phMetrics.extras.signin_attempted },
            ].map(({ label, value }) => (
              <div key={label} style={card}>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#1e293b' }}>{value}</div>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {/* ── Top apps ── */}
      <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Top Apps</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { title: '🏆 Most Selected', data: metrics.top_apps_selected },
          { title: '❌ Most Cancelled', data: metrics.top_apps_cancelled },
        ].map(({ title, data }) => (
          <div key={title} style={card}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#1e293b', marginBottom: 12 }}>{title}</div>
            {data.length === 0 && <div style={{ fontSize: 12, color: '#94a3b8' }}>No data yet</div>}
            {data.map(({ name, count }) => (
              <div key={name} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, gap: 8 }}>
                <span style={{ fontSize: 12, color: '#475569', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#0F4C81', flexShrink: 0 }}>{count}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* ── Sessions table ── */}
      <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>All Sessions</div>
      <div style={{ ...card, padding: '16px 0' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 520 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(15,76,129,0.1)' }}>
                {['Email', 'Spend', 'Savings', 'Apps', 'Date'].map((h) => (
                  <th key={h} style={{ padding: '6px 14px', textAlign: 'left', color: '#94a3b8', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(metrics.sessions ?? []).map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid rgba(15,76,129,0.05)' }}>
                  <td style={{ padding: '10px 14px', color: '#1e293b', fontWeight: 500, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.email ?? '—'}</td>
                  <td style={{ padding: '10px 14px', color: '#475569' }}>{formatINR(s.total_spend)}</td>
                  <td style={{ padding: '10px 14px', color: '#0d9488', fontWeight: 700 }}>{formatINR(s.total_savings)}</td>
                  <td style={{ padding: '10px 14px', color: '#475569' }}>{Array.isArray(s.apps_selected) ? s.apps_selected.length : 0}</td>
                  <td style={{ padding: '10px 14px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                    {new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
