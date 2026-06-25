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

function fmt(z: { id: string; postcode: string; minOrder: number; deliveryFee: number; enabled: boolean }) {
  return { id: z.id, postcode: z.postcode, minOrder: z.minOrder / 100, deliveryFee: z.deliveryFee / 100, enabled: z.enabled }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = adminOnly(req)
  if (deny) return deny
  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.postcode   !== undefined) data.postcode    = body.postcode.toUpperCase()
  if (body.minOrder   !== undefined) data.minOrder    = Math.round(body.minOrder * 100)
  if (body.deliveryFee !== undefined) data.deliveryFee = Math.round(body.deliveryFee * 100)
  if (body.enabled    !== undefined) data.enabled     = body.enabled
  const zone = await prisma.deliveryZone.update({ where: { id }, data })
  return NextResponse.json({ zone: fmt(zone) })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = adminOnly(req)
  if (deny) return deny
  const { id } = await params
  await prisma.deliveryZone.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
