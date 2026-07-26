import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSessionPayload } from '@/lib/auth-utils'

async function adminOnly(req: NextRequest) {
  const payload = await getSessionPayload(req)
  if (!payload || payload.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const deny = await adminOnly(req)
  if (deny) return deny

  const now        = new Date()
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)
  const todayEnd   = new Date(now); todayEnd.setHours(23, 59, 59, 999)
  const yesterday  = new Date(todayStart); yesterday.setDate(yesterday.getDate() - 1)
  const ydEnd      = new Date(todayStart); ydEnd.setMilliseconds(-1)
  const weekStart  = new Date(todayStart); weekStart.setDate(weekStart.getDate() - 6)

  const ACTIVE_STATUSES = ['New', 'Accepted', 'Preparing', 'Ready', 'Out for Delivery']
  const DONE_STATUSES   = ['Completed']

  const [
    todayOrders,
    yesterdayOrders,
    pendingCount,
    customerCount,
    weekOrders,
    recentOrders,
  ] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: todayStart, lte: todayEnd }, status: { notIn: ['Cancelled', 'payment_failed'] } },
      select: { total: true },
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: yesterday, lte: ydEnd }, status: { notIn: ['Cancelled', 'payment_failed'] } },
      select: { total: true },
    }),
    prisma.order.count({ where: { status: { in: ACTIVE_STATUSES } } }),
    prisma.user.count({ where: { role: 'user' } }),
    prisma.order.findMany({
      where: { createdAt: { gte: weekStart }, status: { notIn: ['Cancelled', 'payment_failed'] } },
      select: { total: true, createdAt: true },
    }),
    prisma.order.findMany({
      where: { status: { notIn: ['payment_failed'] } },
      include: { items: { select: { productName: true, quantity: true, itemTotal: true } } },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
  ])

  const todayRevenue = todayOrders.reduce((s, o) => s + o.total, 0) / 100
  const ydRevenue    = yesterdayOrders.reduce((s, o) => s + o.total, 0) / 100
  const revChangePct = ydRevenue > 0 ? Math.round(((todayRevenue - ydRevenue) / ydRevenue) * 100) : 0

  // Product popularity (this week)
  const productMap: Record<string, { name: string; orders: number; revenue: number }> = {}
  for (const o of weekOrders) {
    // We don't have items here but that's OK — this week stats are on revenue
  }

  return NextResponse.json({
    today: {
      revenue: todayRevenue,
      orders: todayOrders.length,
      revChangePct,
      ordersVsYesterday: todayOrders.length - yesterdayOrders.length,
    },
    pendingCount,
    customerCount,
    weekRevenue: weekOrders.reduce((s, o) => s + o.total, 0) / 100,
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      status: o.status,
      total: o.total / 100,
      orderType: o.orderType,
      paymentMethod: o.paymentMethod,
      createdAt: o.createdAt,
      itemsSummary: o.items.slice(0, 2).map((i) => `${i.quantity}× ${i.productName}`).join(', '),
    })),
  })
}
