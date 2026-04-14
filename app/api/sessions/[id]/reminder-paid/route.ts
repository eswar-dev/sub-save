import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const email = typeof body?.email === 'string' ? body.email.trim() : null

    const supabase = createServiceClient()

    const updateData: Record<string, unknown> = { reminder_paid: true }
    if (email) updateData.email = email

    const { error } = await supabase
      .from('sessions')
      .update(updateData)
      .eq('id', id)

    if (error) return Response.json({ error: 'Update failed' }, { status: 500 })
    return Response.json({ ok: true })
  } catch (err) {
    console.error('reminder-paid PATCH error:', err)
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}
