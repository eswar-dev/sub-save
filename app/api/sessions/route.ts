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
