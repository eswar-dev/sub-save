import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = (body?.email ?? '').trim().toLowerCase()
    const code = (body?.code ?? '').trim()
    const local_session_id = body?.local_session_id ?? null

    if (!email || !code) {
      return Response.json({ error: 'Missing email or code' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data: otp } = await supabase
      .from('otp_codes')
      .select('id, expires_at, used')
      .eq('email', email)
      .eq('code', code)
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!otp) return Response.json({ error: 'Invalid code' }, { status: 400 })
    if (new Date(otp.expires_at) < new Date()) return Response.json({ error: 'Code expired' }, { status: 400 })

    await supabase.from('otp_codes').update({ used: true }).eq('id', otp.id)

    if (local_session_id) {
      await supabase.from('sessions').update({ email }).eq('session_id', local_session_id).is('email', null)
    }

    const { data: sessions } = await supabase
      .from('sessions')
      .select('id, apps_selected, total_spend, total_savings, created_at')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1)

    return Response.json({ ok: true, session: sessions?.[0] ?? null })
  } catch (err) {
    console.error('verify-otp error:', err)
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}
