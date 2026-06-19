import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { generateOrderNumber } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const {
    userId,
    orderType,
    customerName,
    customerEmail,
    customerPhone,
    deliveryAddress,
    items,
    subtotal,
    deliveryFee,
    discount,
    total,
    paymentIntentId,
    paymentMethod,
    scheduledTime,
  } = await req.json()

  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      userId: userId ?? null,
      status: paymentMethod === 'cash' ? 'pending' : 'confirmed',
      orderType,
      customerName,
      customerEmail,
      customerPhone,
      deliveryAddress: deliveryAddress ? JSON.stringify(deliveryAddress) : null,
      subtotal: Math.round(subtotal),
      deliveryFee: Math.round(deliveryFee),
      discount: Math.round(discount),
      total: Math.round(total),
      paymentIntentId: paymentIntentId ?? null,
      paymentMethod,
      scheduledTime: scheduledTime ? new Date(scheduledTime) : null,
      items: {
        create: (items as {
          product: { id: string; name: string; price: number }
          quantity: number
          modifiers: Record<string, unknown>[]
          specialInstructions: string
          itemTotal: number
        }[]).map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: Math.round(item.product.price * 100),
          modifiers: JSON.stringify(item.modifiers),
          specialInstructions: item.specialInstructions,
          itemTotal: Math.round(item.itemTotal * 100),
        })),
      },
    },
  })

  return NextResponse.json({ orderNumber: order.orderNumber })
}
