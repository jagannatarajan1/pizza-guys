import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const coupons = await prisma.coupon.findMany({
    where: {
      active: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: {
      code: true, type: true, value: true, description: true, minOrder: true,
      orderTypes: true, combinable: true, combinesWith: true, applicableCategories: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({
    coupons: coupons.map((c) => ({
      code: c.code,
      type: c.type,
      value: c.type === 'fixed' ? c.value / 100 : c.value,
      minOrder: c.minOrder / 100,
      description: c.description,
      orderTypes: c.orderTypes,
      combinable: c.combinable,
      combinesWith: c.combinesWith,
      applicableCategories: c.applicableCategories,
    })),
  })
}
