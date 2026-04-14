import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { app_id, reminder_config } = await request.json()

    if (!app_id || !reminder_config) {
      return Response.json({ error: 'Missing app_id or reminder_config' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Verify reminder_paid before writing
    const { data: session } = await supabase
      .from('sessions')
      .select('apps_selected, reminder_paid')
      .eq('id', id)
      .single()

    if (!session?.reminder_paid) {
      return Response.json({ error: 'Payment required' }, { status: 403 })
    }

    // Update the specific app in apps_selected jsonb array
    const apps = session.apps_selected as Array<{ id: string; reminder_config?: unknown }>
    const updated = apps.map((app: { id: string; reminder_config?: unknown }) =>
      app.id === app_id ? { ...app, reminder_config } : app
    )

    const { error } = await supabase
      .from('sessions')
      .update({ apps_selected: updated })
      .eq('id', id)

    if (error) return Response.json({ error: 'Update failed' }, { status: 500 })
    return Response.json({ ok: true })
  } catch (err) {
    console.error('Reminder PATCH error:', err)
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}
