import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireViewer } from '@/lib/api-guard'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const guard = await requireViewer(req)
  if (!guard.ok) return guard.res

  const { searchParams } = new URL(req.url)
  const status  = searchParams.get('status') || 'All'
  const search  = searchParams.get('search') || ''
  const page    = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit   = 30

  const where: Record<string, unknown> = {}
  if (status !== 'All') where.status = status
  if (search) {
    where.OR = [
      { orderNumber: { contains: search } },
      { customerName: { contains: search } },
      { customerPhone: { contains: search } },
    ]
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.order.count({ where }),
  ])

  return NextResponse.json({
    orders: orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      orderType: o.orderType,
      customerName: o.customerName,
      customerEmail: o.customerEmail,
      customerPhone: o.customerPhone,
      deliveryAddress: o.deliveryAddress,
      subtotal: o.subtotal / 100,
      deliveryFee: o.deliveryFee / 100,
      discount: o.discount / 100,
      total: o.total / 100,
      paymentMethod: o.paymentMethod,
      scheduledTime: o.scheduledTime,
      acceptedAt: o.acceptedAt,
      prepMinutes: o.prepMinutes,
      createdAt: o.createdAt,
      items: o.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        name: i.productName,
        quantity: i.quantity,
        unitPrice: i.unitPrice / 100,
        itemTotal: i.itemTotal / 100,
        // Full customization snapshot — same shape the customer-facing order
        // APIs already return (see /api/orders and /api/orders/[orderNumber]).
        // Staff need this to know exactly what to make, not just the product name.
        modifiers: (() => { try { return JSON.parse(i.modifiers || '[]') } catch { return [] } })(),
        specialInstructions: i.specialInstructions,
      })),
    })),
    total,
    page,
    pages: Math.ceil(total / limit),
  })
}
