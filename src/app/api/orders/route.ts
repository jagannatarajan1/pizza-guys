import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { generateOrderNumber } from '@/lib/utils'
import { getSessionPayload } from '@/lib/auth-utils'
import { requireAuth } from '@/lib/api-guard'

export async function GET(req: NextRequest) {
  const payload = await getSessionPayload(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orders = await prisma.order.findMany({
    where: {
      userId: payload.userId,
      NOT: { status: 'pending_payment' },
    },
    include: { items: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  // Look up product images for all order items in one query
  const productIds = [...new Set(orders.flatMap((o) => o.items.map((i) => i.productId)))]
  const products   = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, image: true },
  })
  const imageMap = Object.fromEntries(products.map((p) => [p.id, p.image]))

  return NextResponse.json({
    orders: orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      orderType: o.orderType,
      customerName: o.customerName,
      customerEmail: o.customerEmail,
      customerPhone: o.customerPhone,
      deliveryAddress: o.deliveryAddress ? JSON.parse(o.deliveryAddress) : null,
      subtotal: o.subtotal / 100,
      deliveryFee: o.deliveryFee / 100,
      discount: o.discount / 100,
      total: o.total / 100,
      paymentMethod: o.paymentMethod,
      scheduledTime: o.scheduledTime,
      createdAt: o.createdAt,
      items: o.items.map((i) => ({
        productId: i.productId,
        name:      i.productName,
        quantity:  i.quantity,
        unitPrice: i.unitPrice / 100,
        itemTotal: i.itemTotal / 100,
        // Stored as a JSON string of CartItemModifier[] — parsed here so the
        // client never has to know or care about the DB's storage format.
        modifiers: (() => { try { return JSON.parse(i.modifiers || '[]') } catch { return [] } })(),
        specialInstructions: i.specialInstructions,
        image:     imageMap[i.productId] ?? '',
      })),
    })),
  })
}

export async function POST(req: NextRequest) {
  const guard = await requireAuth(req)
  if (!guard.ok) return guard.res

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
      status: 'New',
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
