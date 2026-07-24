import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe-server'
import prisma from '@/lib/prisma'
import { emitNewOrder, emitStatusChanged } from '@/lib/order-events'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  // Stripe Checkout Session completed (hosted page flow)
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const orderId = session.metadata?.orderId
    const orderNumber = session.metadata?.orderNumber
    if (orderId) {
      // Guarded + counted rather than a plain update: Stripe delivers
      // webhooks "at least once", so the same event can arrive twice — this
      // keeps a duplicate delivery from re-announcing an order that was
      // already confirmed (by this same webhook or by the success-page
      // reconciliation check racing it).
      const result = await prisma.order.updateMany({
        where: { id: orderId, status: { not: 'confirmed' } },
        data:  { status: 'confirmed', paymentIntentId: session.payment_intent as string },
      })
      if (result.count > 0 && orderNumber) {
        emitNewOrder({ orderNumber })
        emitStatusChanged({ orderNumber, status: 'confirmed' })
      }
    }
  }

  // Payment Intent flows
  if (event.type === 'payment_intent.succeeded') {
    const result = await prisma.order.updateMany({
      where: { paymentIntentId: event.data.object.id, status: { not: 'confirmed' } },
      data:  { status: 'confirmed' },
    })
    if (result.count > 0) {
      const order = await prisma.order.findFirst({ where: { paymentIntentId: event.data.object.id } })
      if (order) {
        emitNewOrder({ orderNumber: order.orderNumber })
        emitStatusChanged({ orderNumber: order.orderNumber, status: 'confirmed' })
      }
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const result = await prisma.order.updateMany({
      where: { paymentIntentId: event.data.object.id },
      data:  { status: 'payment_failed' },
    })
    if (result.count > 0) {
      const order = await prisma.order.findFirst({ where: { paymentIntentId: event.data.object.id } })
      if (order) emitStatusChanged({ orderNumber: order.orderNumber, status: 'payment_failed' })
    }
  }

  return NextResponse.json({ received: true })
}
