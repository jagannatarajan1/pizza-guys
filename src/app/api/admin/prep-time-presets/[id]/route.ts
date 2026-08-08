import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/api-guard'

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(req)
  if (!guard.ok) return guard.res
  const { id } = await ctx.params

  const { minutes, move } = await req.json()

  if (move === 'up' || move === 'down') {
    const current = await prisma.prepTimePreset.findUnique({ where: { id } })
    if (!current) return NextResponse.json({ error: 'Preset not found' }, { status: 404 })

    // The row immediately above/below in display order — swapping with it is
    // what "move up/down" means.
    const neighbour = await prisma.prepTimePreset.findFirst({
      where:   { sortOrder: move === 'up' ? { lt: current.sortOrder } : { gt: current.sortOrder } },
      orderBy: { sortOrder: move === 'up' ? 'desc' : 'asc' },
    })
    if (!neighbour) return NextResponse.json({ ok: true })

    // Both writes together, so a failure can't leave two rows claiming the
    // same position.
    await prisma.$transaction([
      prisma.prepTimePreset.update({ where: { id: current.id },   data: { sortOrder: neighbour.sortOrder } }),
      prisma.prepTimePreset.update({ where: { id: neighbour.id }, data: { sortOrder: current.sortOrder } }),
    ])
    return NextResponse.json({ ok: true })
  }

  if (minutes !== undefined) {
    const mins = Number(minutes)
    if (!Number.isInteger(mins) || mins < 1 || mins > 360) {
      return NextResponse.json({ error: 'Enter a whole number of minutes between 1 and 360' }, { status: 400 })
    }
    const preset = await prisma.prepTimePreset.update({ where: { id }, data: { minutes: mins } })
    return NextResponse.json({ preset })
  }

  return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(req)
  if (!guard.ok) return guard.res
  const { id } = await ctx.params
  await prisma.prepTimePreset.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
