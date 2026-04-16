import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendOTPEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = (body?.email ?? '').trim().toLowerCase()

    if (!email || !email.includes('@')) {
      return Response.json({ error: 'Invalid email' }, { status: 400 })
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    const supabase = createServiceClient()
    const { error: dbError } = await supabase
      .from('otp_codes')
      .insert({ email, code, expires_at })

    if (dbError) {
      console.error('OTP insert error:', dbError)
      return Response.json({ error: 'Internal error' }, { status: 500 })
    }

    await sendOTPEmail(email, code)

    return Response.json({ ok: true })
  } catch (err) {
    console.error('send-otp error:', err)
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}
