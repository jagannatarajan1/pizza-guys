import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, AUTH_COOKIE } from '@/lib/auth-utils'

function adminOnly(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE)?.value
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const deny = adminOnly(req)
  if (deny) return deny

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
      createdAt: o.createdAt,
      items: o.items.map((i) => ({
        id: i.id,
        name: i.productName,
        quantity: i.quantity,
        unitPrice: i.unitPrice / 100,
        itemTotal: i.itemTotal / 100,
        specialInstructions: i.specialInstructions,
      })),
    })),
    total,
    page,
    pages: Math.ceil(total / limit),
  })
}
