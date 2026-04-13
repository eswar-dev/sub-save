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
