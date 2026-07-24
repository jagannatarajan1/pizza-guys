import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/api-guard'

export const dynamic = 'force-dynamic'

function fmt(b: { id: string; fromMiles: number; toMiles: number; minOrder: number; deliveryFee: number; sortOrder: number }) {
  return {
    id: b.id,
    fromMiles: b.fromMiles,
    toMiles: b.toMiles,
    minOrder: b.minOrder / 100,
    deliveryFee: b.deliveryFee / 100,
    sortOrder: b.sortOrder,
  }
}

export async function GET(req: NextRequest) {
  const guard = requireAdmin(req)
  if (!guard.ok) return guard.res
  const bands = await prisma.deliveryBand.findMany({ orderBy: { fromMiles: 'asc' } })
  return NextResponse.json({ bands: bands.map(fmt) })
}

export async function POST(req: NextRequest) {
  const guard = requireAdmin(req)
  if (!guard.ok) return guard.res

  const { fromMiles, toMiles, minOrder, deliveryFee } = await req.json()
  if (fromMiles == null || toMiles == null || toMiles <= fromMiles) {
    return NextResponse.json({ error: '"To" distance must be greater than "From" distance' }, { status: 400 })
  }

  const band = await prisma.deliveryBand.create({
    data: {
      fromMiles: parseFloat(fromMiles),
      toMiles: parseFloat(toMiles),
      minOrder: Math.round((minOrder ?? 0) * 100),
      deliveryFee: Math.round((deliveryFee ?? 0) * 100),
      sortOrder: Math.round(parseFloat(fromMiles) * 100),
    },
  })
  return NextResponse.json({ band: fmt(band) }, { status: 201 })
}
