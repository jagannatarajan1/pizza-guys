import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe-server'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session_id')
  if (!sessionId) return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })

  const session = await stripe.checkout.sessions.retrieve(sessionId)

  // The Stripe webhook is the primary way an order gets marked confirmed —
  // but if it's ever missed (wrong URL/secret registered in the Stripe
  // dashboard, a brief outage, retries exhausted) the customer still lands
  // here with a genuinely successful payment while the order sits pending
  // forever. This route only ever runs after a real redirect back from
  // Stripe, so it doubles as a reconciliation check using Stripe's own
  // session as the source of truth — the DB write is a no-op if the webhook
  // already did it.
  const orderId = session.metadata?.orderId
  if (orderId && session.payment_status === 'paid') {
    await prisma.order.updateMany({
      where: { id: orderId, status: { not: 'confirmed' } },
      data: {
        status: 'confirmed',
        ...(typeof session.payment_intent === 'string' ? { paymentIntentId: session.payment_intent } : {}),
      },
    }).catch(() => {})
  }

  return NextResponse.json({
    status:      session.status,
    orderNumber: session.metadata?.orderNumber ?? null,
    email:       session.customer_details?.email ?? null,
  })
}
