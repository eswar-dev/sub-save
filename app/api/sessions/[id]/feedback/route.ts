import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { feedback_meta } = await request.json()

    if (!feedback_meta) {
      return Response.json({ error: 'Missing feedback_meta' }, { status: 400 })
    }

    const supabase = createServiceClient()
    const { error } = await supabase
      .from('sessions')
      .update({
        feedback_rating: feedback_meta.rating ?? null,
        feedback_text: feedback_meta.text ?? null,
        feedback_meta,
      })
      .eq('id', id)

    if (error) return Response.json({ error: 'Update failed' }, { status: 500 })
    return Response.json({ ok: true })
  } catch (err) {
    console.error('Feedback PATCH error:', err)
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}
