import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe-server'
import prisma from '@/lib/prisma'
import { generateOrderNumber } from '@/lib/utils'

type CartItem = {
  product: { id: string; name: string; price: number }
  quantity: number
  modifiers: Record<string, unknown>[]
  specialInstructions: string
  itemTotal: number
}

export async function POST(req: NextRequest) {
  const origin = req.nextUrl.origin

  const {
    userId, orderType, customerName, customerEmail, customerPhone,
    deliveryAddress, items, subtotal, deliveryFee, discount, total,
    scheduledTime,
  } = await req.json()

  // orderPayload already sends subtotal/deliveryFee/discount/total as pence (× 100 done client-side)
  // items have product.price in £ and itemTotal in £ (same as /api/orders)

  const order = await prisma.order.create({
    data: {
      orderNumber:     generateOrderNumber(),
      userId:          userId ?? null,
      status:          'pending_payment',
      orderType,
      customerName,
      customerEmail,
      customerPhone,
      deliveryAddress: deliveryAddress ? JSON.stringify(deliveryAddress) : null,
      subtotal:        Math.round(subtotal),
      deliveryFee:     Math.round(deliveryFee ?? 0),
      discount:        Math.round(discount ?? 0),
      total:           Math.round(total),
      paymentMethod:   'card',
      scheduledTime:   scheduledTime ? new Date(scheduledTime) : null,
      items: {
        create: (items as CartItem[]).map((i) => ({
          productId:           i.product.id,
          productName:         i.product.name,
          quantity:            i.quantity,
          unitPrice:           Math.round(i.product.price * 100),
          modifiers:           JSON.stringify(i.modifiers),
          specialInstructions: i.specialInstructions ?? '',
          itemTotal:           Math.round(i.itemTotal * 100),
        })),
      },
    },
  })

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency:     'gbp',
          unit_amount:  Math.round(total), // already in pence
          product_data: {
            name:        `Pizza Guys Order #${order.orderNumber}`,
            description: `${items.length} item${items.length !== 1 ? 's' : ''} · ${orderType === 'delivery' ? 'Delivery' : 'Collection'}`,
          },
        },
      },
    ],
    ...(customerEmail && isValidEmail(customerEmail) ? { customer_email: customerEmail } : {}),
    metadata:    { orderId: order.id, orderNumber: order.orderNumber },
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${origin}/checkout?cancelled=1`,
  })

  // Store Stripe session ID so webhook can look up the order
  await prisma.order.update({
    where: { id: order.id },
    data:  { paymentIntentId: session.id },
  })

  return NextResponse.json({ url: session.url })
}
