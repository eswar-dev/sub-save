# Sign-in Domain Allowlist + Admin Dashboard + Desktop Block Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** (1) Restrict sign-in to common email domains and redirect new users to the quiz; (2) add a protected `/admin` dashboard showing live session metrics; (3) block desktop screens (>1024px wide) with a mobile-only message.

**Architecture:** Domain check added server-side in the signin API before the sessions lookup. New `startQuizWithEmail` store action pre-fills email for new users entering via sign-in. Admin metrics API guards with `x-admin-email` header; admin page guards client-side first. `DesktopBlock` client component wraps all children in `layout.tsx`, swapping in a full-screen message on wide screens.

**Tech Stack:** Next.js 15 App Router, Zustand, Supabase (service client), TypeScript, inline styles (existing pattern)

---

## File Map

| Action | Path |
|--------|------|
| Modify | `app/api/auth/signin/route.ts` |
| Modify | `lib/store/quizStore.ts` |
| Modify | `app/api/sessions/route.ts` |
| Modify | `components/screens/ResultsScreen.tsx` |
| Modify | `components/sheets/SignInSheet.tsx` |
| Create | `app/api/admin/metrics/route.ts` |
| Create | `app/admin/page.tsx` |
| Create | `components/DesktopBlock.tsx` |
| Modify | `app/layout.tsx` |

---

## Task 1 — Domain allowlist in signin API

**Files:**
- Modify: `app/api/auth/signin/route.ts`

- [ ] **Step 1: Replace the full file content**

```typescript
import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

const ALLOWED_DOMAINS = new Set([
  'gmail.com', 'googlemail.com',
  'outlook.com', 'hotmail.com', 'live.com', 'msn.com',
  'yahoo.com', 'ymail.com',
  'icloud.com', 'me.com', 'mac.com',
  'protonmail.com', 'pm.me',
  'rediffmail.com', 'zoho.com', 'aol.com',
])

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    if (!email || !email.includes('@')) {
      return Response.json({ allowed: false, found: false, error: 'Invalid email' }, { status: 400 })
    }

    const domain = email.split('@')[1]?.toLowerCase()
    if (!domain || !ALLOWED_DOMAINS.has(domain)) {
      return Response.json(
        { allowed: false, found: false, error: 'Please use a personal email (Gmail, Outlook, Yahoo, etc.)' },
        { status: 400 },
      )
    }

    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('sessions')
      .select('id, apps_selected, total_spend, total_savings, reminder_paid, created_at')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      return Response.json({ allowed: true, found: false })
    }

    return Response.json({ allowed: true, found: true, session: data })
  } catch (err) {
    console.error('Signin error:', err)
    return Response.json({ allowed: false, found: false, error: 'Internal error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/auth/signin/route.ts
git commit -m "feat: add domain allowlist to signin API"
```

---

## Task 2 — Add `startQuizWithEmail` to quiz store

**Files:**
- Modify: `lib/store/quizStore.ts`

- [ ] **Step 1: Add `startQuizWithEmail` to the `QuizStore` interface**

In `lib/store/quizStore.ts`, find the `// ── RESULTS ──` section of the interface. Add one line after `setReturningUser`:

```typescript
  startQuizWithEmail: (email: string) => void
```

- [ ] **Step 2: Add the implementation inside `create<QuizStore>(...)`**

Find the `setReturningUser` implementation and add the new action immediately after it:

```typescript
  startQuizWithEmail: (email) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sps_email', email)
    }
    SCREEN_HISTORY.length = 0
    set({
      userEmail: email,
      activeScreen: 'app-select',
      previousScreen: 'welcome',
      selected: {},
      totalSpend: 0,
      answers: {},
      cards: [],
      cardIndex: 0,
      results: [],
      sessionId: null,
      isReturningUser: false,
      lastAuditDate: null,
    })
  },
```

- [ ] **Step 3: Commit**

```bash
git add lib/store/quizStore.ts
git commit -m "feat: add startQuizWithEmail action to quiz store"
```

---

## Task 3 — Save email when session is created

**Files:**
- Modify: `app/api/sessions/route.ts`
- Modify: `components/screens/ResultsScreen.tsx`

- [ ] **Step 1: Update the sessions POST API to accept and save email**

Replace `app/api/sessions/route.ts` with:

```typescript
import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { session_id, apps_selected, total_spend, total_savings, email } = body

    if (!session_id || !apps_selected || !Array.isArray(apps_selected)) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        session_id,
        apps_selected,
        total_spend: Math.round(total_spend ?? 0),
        total_savings: Math.round(total_savings ?? 0),
        ...(email ? { email } : {}),
      })
      .select('id')
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      return Response.json({ error: 'Failed to save session' }, { status: 500 })
    }

    return Response.json({ id: data.id })
  } catch (err) {
    console.error('Sessions POST error:', err)
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Update ResultsScreen to pass email when saving the session**

In `components/screens/ResultsScreen.tsx`, find the `useEffect` that calls `fetch('/api/sessions', ...)`. Replace the `body: JSON.stringify(...)` object with:

```typescript
      body: JSON.stringify({
        session_id: localStorage.getItem('sps_session_id'),
        apps_selected: results,
        total_spend: totalSpend,
        total_savings: totalSavings,
        email: userEmail ?? localStorage.getItem('sps_email') ?? undefined,
      }),
```

- [ ] **Step 3: Commit**

```bash
git add app/api/sessions/route.ts components/screens/ResultsScreen.tsx
git commit -m "feat: save email to session on results"
```

---

## Task 4 — Update SignInSheet to handle new response states

**Files:**
- Modify: `components/sheets/SignInSheet.tsx`

- [ ] **Step 1: Add `startQuizWithEmail` to the store destructure**

Find this line at the top of `SignInSheet`:
```typescript
  const { setReturningUser } = useQuizStore()
```

Replace it with:
```typescript
  const { setReturningUser, startQuizWithEmail } = useQuizStore()
```

- [ ] **Step 2: Replace the `handleSignIn` function body**

Find the full `handleSignIn` function and replace its body with:

```typescript
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
```

- [ ] **Step 3: Commit**

```bash
git add components/sheets/SignInSheet.tsx
git commit -m "feat: handle domain block and new user redirect in sign-in sheet"
```

---

## Task 5 — Admin metrics API

**Files:**
- Create: `app/api/admin/metrics/route.ts`

- [ ] **Step 1: Create the file**

```typescript
import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { AppResult } from '@/lib/scoring'

const ADMIN_EMAILS = ['eswar@gmail.com']

export async function GET(request: NextRequest) {
  const adminEmail = request.headers.get('x-admin-email')
  if (!adminEmail || !ADMIN_EMAILS.includes(adminEmail)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createServiceClient()
  const { data: sessions, error } = await supabase
    .from('sessions')
    .select('id, email, total_spend, total_savings, apps_selected, created_at')
    .order('created_at', { ascending: false })

  if (error || !sessions) {
    return Response.json({ error: 'Failed to fetch sessions' }, { status: 500 })
  }

  const uniqueEmails = new Set(sessions.filter((s) => s.email).map((s) => s.email))
  const avgSavings = sessions.length > 0
    ? Math.round(sessions.reduce((s, r) => s + (r.total_savings ?? 0), 0) / sessions.length)
    : 0
  const avgSpend = sessions.length > 0
    ? Math.round(sessions.reduce((s, r) => s + (r.total_spend ?? 0), 0) / sessions.length)
    : 0

  const selectedCounts: Record<string, number> = {}
  const cancelledCounts: Record<string, number> = {}

  for (const session of sessions) {
    const apps = (session.apps_selected ?? []) as AppResult[]
    for (const app of apps) {
      selectedCounts[app.name] = (selectedCounts[app.name] ?? 0) + 1
      if (app.verdict === 'cancel') {
        cancelledCounts[app.name] = (cancelledCounts[app.name] ?? 0) + 1
      }
    }
  }

  const top_apps_selected = Object.entries(selectedCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }))

  const top_apps_cancelled = Object.entries(cancelledCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }))

  return Response.json({
    summary: {
      total_sessions: sessions.length,
      unique_users: uniqueEmails.size,
      avg_savings: avgSavings,
      avg_spend: avgSpend,
    },
    top_apps_selected,
    top_apps_cancelled,
    sessions,
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/admin/metrics/route.ts
git commit -m "feat: admin metrics API with email guard"
```

---

## Task 6 — Admin dashboard page

**Files:**
- Create: `app/admin/page.tsx`

- [ ] **Step 1: Create the file**

```typescript
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

function formatINR(n: number) {
  return `₹${n.toLocaleString('en-IN')}`
}

export default function AdminPage() {
  const router = useRouter()
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [adminEmail, setAdminEmail] = useState('')

  useEffect(() => {
    const email = typeof window !== 'undefined' ? localStorage.getItem('sps_email') ?? '' : ''
    if (!ADMIN_EMAILS.includes(email)) {
      router.replace('/')
      return
    }
    setAdminEmail(email)
    fetch('/api/admin/metrics', { headers: { 'x-admin-email': email } })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); setLoading(false); return }
        setMetrics(data)
        setLoading(false)
      })
      .catch(() => { setError('Failed to load metrics'); setLoading(false) })
  }, [router])

  const F = { fontFamily: 'Plus Jakarta Sans, -apple-system, sans-serif' }

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

  const cardStyle = {
    background: 'rgba(255,255,255,0.72)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)' as const,
    borderRadius: 16,
    padding: '16px 14px',
    border: '1px solid rgba(255,255,255,0.5)',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(150deg, #dbeafe 0%, #e8f4fd 45%, #d4f6ef 100%)', ...F, padding: '24px 16px 48px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#1e293b' }}>Admin Dashboard</div>
        <div style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>{adminEmail}</div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Total Sessions', value: String(metrics.summary.total_sessions) },
          { label: 'Unique Users', value: String(metrics.summary.unique_users) },
          { label: 'Avg Savings/mo', value: formatINR(metrics.summary.avg_savings) },
          { label: 'Avg Spend/mo', value: formatINR(metrics.summary.avg_spend) },
        ].map(({ label, value }) => (
          <div key={label} style={cardStyle}>
            <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#1e293b' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Top apps */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { title: '🏆 Most Selected', data: metrics.top_apps_selected },
          { title: '❌ Most Cancelled', data: metrics.top_apps_cancelled },
        ].map(({ title, data }) => (
          <div key={title} style={cardStyle}>
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

      {/* Sessions table */}
      <div style={{ ...cardStyle, padding: '16px 0' }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#1e293b', marginBottom: 12, paddingInline: 14 }}>
          All Sessions ({metrics.sessions.length})
        </div>
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
              {metrics.sessions.map((s) => (
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
```

- [ ] **Step 2: Commit**

```bash
git add app/admin/page.tsx
git commit -m "feat: admin dashboard page at /admin"
```

---

## Task 7 — Desktop block

**Files:**
- Create: `components/DesktopBlock.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Create `components/DesktopBlock.tsx`**

```typescript
'use client'

import { useEffect, useState } from 'react'

export default function DesktopBlock({ children }: { children: React.ReactNode }) {
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth > 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  if (isDesktop) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(150deg, #dbeafe 0%, #e8f4fd 45%, #d4f6ef 100%)',
        fontFamily: 'Plus Jakarta Sans, -apple-system, sans-serif',
        padding: '40px 24px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 56, marginBottom: 20 }}>📱</div>
        <div style={{ fontSize: 26, fontWeight: 900, color: '#1e293b', marginBottom: 10 }}>
          Built for phones &amp; tablets
        </div>
        <div style={{ fontSize: 15, color: '#475569', fontWeight: 500, maxWidth: 380, lineHeight: 1.7 }}>
          SUB PAY SAVER is designed for mobile. Open this link on your phone or tablet to get started.
        </div>
        <div style={{
          marginTop: 28, fontSize: 14, fontWeight: 700,
          background: 'linear-gradient(135deg, #0F4C81 0%, #2DD4BF 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          subpaysaver.app
        </div>
      </div>
    )
  }

  return <>{children}</>
}
```

- [ ] **Step 2: Wrap children in `app/layout.tsx`**

In `app/layout.tsx`, add the import at the top:
```typescript
import DesktopBlock from '@/components/DesktopBlock'
```

Then wrap `{children}` in the body:
```typescript
      <body className="h-full">
        <DesktopBlock>{children}</DesktopBlock>
      </body>
```

- [ ] **Step 3: Commit**

```bash
git add components/DesktopBlock.tsx app/layout.tsx
git commit -m "feat: block desktop viewports with mobile-only message"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** Domain allowlist ✓ | New user redirect ✓ | Returning user unchanged ✓ | Admin API with server guard ✓ | Admin page with client guard ✓ | Desktop block ✓
- [x] **No placeholders:** All steps have concrete code
- [x] **Type consistency:** `AppResult` imported in metrics API; `startQuizWithEmail` signature matches interface and usage in SignInSheet
- [x] **Email save flow:** Sessions POST now accepts optional email; ResultsScreen reads `userEmail` from store (set by `startQuizWithEmail`) and also falls back to `sps_email` in localStorage
