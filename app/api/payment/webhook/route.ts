import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-razorpay-signature') ?? ''
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? ''

    // Verify signature
    if (secret) {
      const expected = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex')

      if (expected !== signature) {
        return new Response('Invalid signature', { status: 400 })
      }
    }

    const event = JSON.parse(body)

    if (event.event === 'payment.captured') {
      const notes = event.payload?.payment?.entity?.notes ?? {}
      const sessionId = notes.session_id
      const email = notes.email

      if (sessionId) {
        const supabase = createServiceClient()
        await supabase
          .from('sessions')
          .update({ reminder_paid: true, email })
          .eq('session_id', sessionId)
      }
    }

    return new Response('OK', { status: 200 })
  } catch (err) {
    console.error('Webhook error:', err)
    return new Response('Error', { status: 500 })
  }
}
