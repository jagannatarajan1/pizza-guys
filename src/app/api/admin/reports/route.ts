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
  const period  = (searchParams.get('period') ?? 'daily') as 'daily' | 'weekly' | 'monthly' | 'custom'
  const fromStr = searchParams.get('from')
  const toStr   = searchParams.get('to')

  const now   = new Date()
  let start   = new Date(now)
  let end: Date | null = null

  if (period === 'custom' && fromStr) {
    start = new Date(fromStr)
    start.setHours(0, 0, 0, 0)
    end = toStr ? new Date(toStr) : new Date(now)
    end.setHours(23, 59, 59, 999)
  } else if (period === 'weekly') {
    start.setDate(start.getDate() - 27)   // 4 weeks
    start.setHours(0, 0, 0, 0)
  } else if (period === 'monthly') {
    start.setMonth(start.getMonth() - 11) // 12 months
    start.setDate(1)
    start.setHours(0, 0, 0, 0)
  } else {
    start.setDate(start.getDate() - 6)
    start.setHours(0, 0, 0, 0)
  }

  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: start, ...(end && { lte: end }) },
      status:    { notIn: ['Cancelled', 'payment_failed'] },
    },
    select: { total: true, createdAt: true, paymentMethod: true },
    orderBy: { createdAt: 'asc' },
  })

  // Group by period bucket — custom ranges always bucket by day.
  const buckets: Record<string, { orders: number; revenue: number; sortKey: number }> = {}

  for (const o of orders) {
    let key: string
    const d = new Date(o.createdAt)
    if (period === 'weekly') {
      // ISO week start (Monday)
      const day = d.getDay()
      const monday = new Date(d)
      monday.setDate(d.getDate() - ((day === 0 ? 7 : day) - 1))
      key = monday.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    } else if (period === 'monthly') {
      key = d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
    } else {
      key = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    }
    if (!buckets[key]) buckets[key] = { orders: 0, revenue: 0, sortKey: d.getTime() }
    buckets[key].orders++
    buckets[key].revenue += o.total / 100
  }

  const data = Object.entries(buckets)
    .sort((a, b) => a[1].sortKey - b[1].sortKey)
    .map(([date, v]) => ({
      date,
      orders: v.orders,
      revenue: Math.round(v.revenue * 100) / 100,
    }))

  // Payment method breakdown
  const paymentMap: Record<string, number> = {}
  for (const o of orders) {
    const m = o.paymentMethod || 'unknown'
    paymentMap[m] = (paymentMap[m] ?? 0) + o.total / 100
  }
  const totalRevenue = orders.reduce((s, o) => s + o.total / 100, 0)
  const paymentBreakdown = Object.entries(paymentMap).map(([method, amount]) => ({
    method,
    amount: Math.round(amount * 100) / 100,
    pct: totalRevenue > 0 ? Math.round((amount / totalRevenue) * 100) : 0,
  })).sort((a, b) => b.amount - a.amount)

  // Top products (from OrderItems)
  const items = await prisma.orderItem.findMany({
    where: {
      order: {
        createdAt: { gte: start, ...(end && { lte: end }) },
        status:    { notIn: ['Cancelled', 'payment_failed'] },
      },
    },
    select: { productName: true, quantity: true, itemTotal: true },
  })

  const productMap: Record<string, { orders: number; revenue: number }> = {}
  for (const item of items) {
    if (!productMap[item.productName]) productMap[item.productName] = { orders: 0, revenue: 0 }
    productMap[item.productName].orders += item.quantity
    productMap[item.productName].revenue += item.itemTotal / 100
  }
  const topProducts = Object.entries(productMap)
    .map(([name, v]) => ({ name, orders: v.orders, revenue: Math.round(v.revenue * 100) / 100 }))
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 8)

  return NextResponse.json({
    data,
    paymentBreakdown,
    topProducts,
    totals: {
      revenue: Math.round(totalRevenue * 100) / 100,
      orders:  orders.length,
      avgOrder: orders.length > 0 ? Math.round((totalRevenue / orders.length) * 100) / 100 : 0,
    },
  })
}
