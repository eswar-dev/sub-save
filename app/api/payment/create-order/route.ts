import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { session_id, email } = await request.json()

    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    if (!keyId || !keySecret) {
      // Demo mode — return a fake order
      return Response.json({
        order_id: null,
        amount: 4900,
        currency: 'INR',
        demo: true,
      })
    }

    // Dynamically import Razorpay (server-only)
    const Razorpay = (await import('razorpay')).default
    const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret })

    const order = await rzp.orders.create({
      amount: 4900,  // ₹49 in paise
      currency: 'INR',
      receipt: `sps_${session_id?.slice(-8) ?? Date.now()}`,
      notes: { session_id, email },
    })

    return Response.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    })
  } catch (err) {
    console.error('Create order error:', err)
    // Fallback — let client proceed in demo mode
    return Response.json({ order_id: null, amount: 4900, currency: 'INR', demo: true })
  }
}
