import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const coupons = await prisma.coupon.findMany({
    where: { active: true },
    select: { code: true, type: true, value: true, description: true, minOrder: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({
    coupons: coupons.map((c) => ({
      code: c.code,
      type: c.type,
      value: c.type === 'fixed' ? c.value / 100 : c.value,
      minOrder: c.minOrder / 100,
      description: c.description,
    })),
  })
}
