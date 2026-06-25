import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe-server'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 })
  }

  let event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  if (event.type === 'payment_intent.succeeded') {
    await prisma.order.updateMany({
      where: { paymentIntentId: event.data.object.id },
      data: { status: 'New' },
    })
  }

  if (event.type === 'payment_intent.payment_failed') {
    await prisma.order.updateMany({
      where: { paymentIntentId: event.data.object.id },
      data: { status: 'payment_failed' },
    })
  }

  return NextResponse.json({ received: true })
}
