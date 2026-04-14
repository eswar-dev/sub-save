import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// ── ESWAR: before this route works in prod, run supabase/beta_schema.sql ──
// beta_codes:    code text PK, max_uses int, current_uses int default 0, is_active bool default true
// invited_emails: email text PK, invited_by text, used_at timestamptz nullable
// Insert one row: INSERT INTO beta_codes (code, max_uses) VALUES ('SPS00', 200);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const input: string = (body?.input ?? '').trim()

    if (!input) {
      return Response.json({ error: 'Enter your code or invite email.' }, { status: 400 })
    }

    const isEmail = input.includes('@')

    if (isEmail) {
      // ── EMAIL INVITE PATH ──
      const email = input.toLowerCase()
      const supabase = createServiceClient()
      const { data, error } = await supabase
        .from('invited_emails')
        .select('email, used_at')
        .eq('email', email)
        .single()

      if (error || !data) {
        return Response.json(
          { error: 'This email wasn\'t invited. Try your access code instead.' },
          { status: 401 },
        )
      }

      // Mark first use
      if (!data.used_at) {
        await supabase
          .from('invited_emails')
          .update({ used_at: new Date().toISOString() })
          .eq('email', email)
      }

      return Response.json({ ok: true, path: 'email', email })
    } else {
      // ── CODE PATH ──
      const code = input.toUpperCase()
      const supabase = createServiceClient()

      const { data, error } = await supabase
        .from('beta_codes')
        .select('code, current_uses, max_uses, is_active')
        .eq('code', code)
        .single()

      if (error || !data) {
        // Fallback: accept env-var code while DB is being set up
        const fallback = (process.env.BETA_CODE ?? 'SPS00').toUpperCase()
        if (code === fallback) {
          return Response.json({ ok: true, path: 'code-fallback' })
        }
        return Response.json({ error: 'Invalid code. Check your invite.' }, { status: 401 })
      }

      if (!data.is_active) {
        return Response.json({ error: 'Beta access is currently paused.' }, { status: 403 })
      }

      if (data.current_uses >= data.max_uses) {
        return Response.json(
          { error: 'Beta is full for now. Check back soon.', full: true },
          { status: 403 },
        )
      }

      // Atomic increment
      await supabase
        .from('beta_codes')
        .update({ current_uses: data.current_uses + 1 })
        .eq('code', code)

      return Response.json({ ok: true, path: 'code' })
    }
  } catch (err) {
    console.error('Beta verify error:', err)
    return Response.json({ error: 'Something went wrong. Try again.' }, { status: 500 })
  }
}
