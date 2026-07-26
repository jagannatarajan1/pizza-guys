import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireViewer } from '@/lib/api-guard'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const guard = await requireViewer(req)
  if (!guard.ok) return guard.res

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const page   = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit  = 30

  const where = search
    ? {
        role: 'user' as const,
        OR: [
          { name:  { contains: search } },
          { email: { contains: search } },
          { phone: { contains: search } },
        ],
      }
    : { role: 'user' as const }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, name: true, email: true, phone: true, createdAt: true,
        _count: { select: { orders: true } },
        orders: {
          select: { total: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.user.count({ where }),
  ])

  // Calculate total spend per customer
  const spends = await Promise.all(
    users.map((u) =>
      prisma.order.aggregate({
        where: { userId: u.id, status: { notIn: ['Cancelled', 'payment_failed'] } },
        _sum: { total: true },
      })
    )
  )

  return NextResponse.json({
    customers: users.map((u, i) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      orderCount: u._count.orders,
      totalSpend: (spends[i]._sum.total ?? 0) / 100,
      joined: u.createdAt,
      lastOrder: u.orders[0]?.createdAt ?? null,
    })),
    total,
    page,
    pages: Math.ceil(total / limit),
  })
}
