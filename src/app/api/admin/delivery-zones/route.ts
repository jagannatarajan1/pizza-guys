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

const SEED = [
  { postcode: 'TW18', minOrder: 1000, deliveryFee: 199 },
  { postcode: 'TW19', minOrder: 1000, deliveryFee: 199 },
  { postcode: 'TW20', minOrder: 1200, deliveryFee: 249 },
  { postcode: 'KT16', minOrder: 1200, deliveryFee: 249 },
  { postcode: 'GU25', minOrder: 1500, deliveryFee: 299 },
]

async function ensureSeeded() {
  const count = await prisma.deliveryZone.count()
  if (count === 0) {
    await prisma.deliveryZone.createMany({ data: SEED })
  }
}

function fmt(z: { id: string; postcode: string; minOrder: number; deliveryFee: number; enabled: boolean }) {
  return { id: z.id, postcode: z.postcode, minOrder: z.minOrder / 100, deliveryFee: z.deliveryFee / 100, enabled: z.enabled }
}

export async function GET(req: NextRequest) {
  const deny = adminOnly(req)
  if (deny) return deny
  await ensureSeeded()
  const zones = await prisma.deliveryZone.findMany({ orderBy: { postcode: 'asc' } })
  return NextResponse.json({ zones: zones.map(fmt) })
}

export async function POST(req: NextRequest) {
  const deny = adminOnly(req)
  if (deny) return deny
  const { postcode, minOrder, deliveryFee } = await req.json()
  if (!postcode) return NextResponse.json({ error: 'postcode required' }, { status: 400 })
  const existing = await prisma.deliveryZone.findUnique({ where: { postcode: postcode.toUpperCase() } })
  if (existing) return NextResponse.json({ error: 'Postcode already exists' }, { status: 409 })
  const zone = await prisma.deliveryZone.create({
    data: { postcode: postcode.toUpperCase(), minOrder: Math.round(minOrder * 100), deliveryFee: Math.round(deliveryFee * 100) },
  })
  return NextResponse.json({ zone: fmt(zone) }, { status: 201 })
}
