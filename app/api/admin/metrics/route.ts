import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { AppResult } from '@/lib/scoring'

const ADMIN_EMAILS = ['eswar30082002@gmail.com']

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
