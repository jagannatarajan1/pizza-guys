import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe-server'

export async function POST(req: NextRequest) {
  const { amount, currency = 'gbp', metadata = {} } = await req.json()

  if (!amount || amount < 50) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount),
    currency,
    automatic_payment_methods: { enabled: true },
    metadata,
  })

  return NextResponse.json({ clientSecret: paymentIntent.client_secret })
}
