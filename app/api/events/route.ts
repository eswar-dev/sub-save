import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { session_id, event, properties } = body

    if (!session_id || !event) {
      return Response.json({ ok: false }, { status: 400 })
    }

    const supabase = createServiceClient()
    await supabase.from('events').insert({ session_id, event, properties: properties ?? {} })

    return Response.json({ ok: true })
  } catch {
    // Events must never fail the app — swallow errors
    return Response.json({ ok: true })
  }
}
