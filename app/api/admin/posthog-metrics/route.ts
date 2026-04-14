import { NextRequest } from 'next/server'

const ADMIN_EMAILS = ['eswar@gmail.com']

const FUNNEL_EVENTS = [
  'quiz_started',
  'questions_started',
  'results_viewed',
  'share_clicked',
  'payment_completed',
  'reminder_set',
  'bell_tapped',
  'signin_attempted',
]

export async function GET(request: NextRequest) {
  const adminEmail = request.headers.get('x-admin-email')
  if (!adminEmail || !ADMIN_EMAILS.includes(adminEmail)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const personalKey = process.env.POSTHOG_PERSONAL_API_KEY
  const projectId = process.env.POSTHOG_PROJECT_ID
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com'

  if (!personalKey || !projectId || personalKey.startsWith('your_')) {
    return Response.json({ error: 'PostHog credentials not configured' }, { status: 503 })
  }

  const query = `
    SELECT event, count(*) AS count, uniq(distinct_id) AS unique_users
    FROM events
    WHERE event IN (${FUNNEL_EVENTS.map((e) => `'${e}'`).join(', ')})
      AND timestamp >= now() - INTERVAL 30 DAY
    GROUP BY event
    ORDER BY count DESC
  `

  const res = await fetch(`${host}/api/projects/${projectId}/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${personalKey}`,
    },
    body: JSON.stringify({ query: { kind: 'HogQLQuery', query } }),
  })

  if (!res.ok) {
    const text = await res.text()
    console.error('PostHog query error:', text)
    return Response.json({ error: 'PostHog query failed' }, { status: 502 })
  }

  const data = await res.json()
  // HogQL returns { results: [[event, count, unique_users], ...], columns: [...] }
  const rows: Record<string, { count: number; unique_users: number }> = {}
  for (const [event, count, unique_users] of (data.results ?? [])) {
    rows[event] = { count: Number(count), unique_users: Number(unique_users) }
  }

  const get = (e: string) => rows[e] ?? { count: 0, unique_users: 0 }

  const funnel = [
    { label: 'Quiz started', event: 'quiz_started', ...get('quiz_started') },
    { label: 'Entered questions', event: 'questions_started', ...get('questions_started') },
    { label: 'Saw results', event: 'results_viewed', ...get('results_viewed') },
    { label: 'Shared', event: 'share_clicked', ...get('share_clicked') },
  ]

  return Response.json({
    funnel,
    extras: {
      bell_tapped: get('bell_tapped').count,
      payment_completed: get('payment_completed').count,
      reminder_set: get('reminder_set').count,
      signin_attempted: get('signin_attempted').count,
    },
    raw: rows,
  })
}
