import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin, requireStaff } from '@/lib/api-guard'

export const dynamic = 'force-dynamic'

const SEED_MINUTES = [5, 10, 15, 20, 30, 45, 60]

// Staff (not just admins) need to read these — it's what fills the
// preparation-time picker when they accept an order.
export async function GET(req: NextRequest) {
  const guard = await requireStaff(req)
  if (!guard.ok) return guard.res

  // Seed on first read so the picker is never empty on a fresh install,
  // matching how modifier groups bootstrap themselves.
  if (await prisma.prepTimePreset.count() === 0) {
    await prisma.prepTimePreset.createMany({
      data: SEED_MINUTES.map((minutes, i) => ({ minutes, sortOrder: i })),
    })
  }

  const presets = await prisma.prepTimePreset.findMany({ orderBy: { sortOrder: 'asc' } })
  return NextResponse.json({ presets })
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (!guard.ok) return guard.res

  const { minutes } = await req.json()
  const mins = Number(minutes)
  if (!Number.isInteger(mins) || mins < 1 || mins > 360) {
    return NextResponse.json({ error: 'Enter a whole number of minutes between 1 and 360' }, { status: 400 })
  }

  const max = await prisma.prepTimePreset.aggregate({ _max: { sortOrder: true } })
  const preset = await prisma.prepTimePreset.create({
    data: { minutes: mins, sortOrder: (max._max.sortOrder ?? -1) + 1 },
  })
  return NextResponse.json({ preset }, { status: 201 })
}
