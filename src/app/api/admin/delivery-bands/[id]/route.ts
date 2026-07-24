import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/api-guard'

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

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = requireAdmin(req)
  if (!guard.ok) return guard.res
  const { id } = await ctx.params

  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.fromMiles   !== undefined) data.fromMiles   = parseFloat(body.fromMiles)
  if (body.toMiles     !== undefined) data.toMiles     = parseFloat(body.toMiles)
  if (body.minOrder    !== undefined) data.minOrder    = Math.round(body.minOrder * 100)
  if (body.deliveryFee !== undefined) data.deliveryFee = Math.round(body.deliveryFee * 100)
  if (data.fromMiles !== undefined) data.sortOrder = Math.round((data.fromMiles as number) * 100)

  const band = await prisma.deliveryBand.update({ where: { id }, data })
  return NextResponse.json({ band: fmt(band) })
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = requireAdmin(req)
  if (!guard.ok) return guard.res
  const { id } = await ctx.params
  await prisma.deliveryBand.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
