import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const SEED = [
  { postcode: 'TW18', minOrder: 1000, deliveryFee: 199 },
  { postcode: 'TW19', minOrder: 1000, deliveryFee: 199 },
  { postcode: 'TW20', minOrder: 1200, deliveryFee: 249 },
  { postcode: 'KT16', minOrder: 1200, deliveryFee: 249 },
  { postcode: 'GU25', minOrder: 1500, deliveryFee: 299 },
]

export async function GET() {
  const count = await prisma.deliveryZone.count()
  if (count === 0) await prisma.deliveryZone.createMany({ data: SEED })

  const zones = await prisma.deliveryZone.findMany({
    where: { enabled: true },
    orderBy: { postcode: 'asc' },
  })

  return NextResponse.json({
    zones: zones.map((z) => ({
      postcode:    z.postcode,
      minOrder:    z.minOrder / 100,
      deliveryFee: z.deliveryFee / 100,
    })),
  })
}
