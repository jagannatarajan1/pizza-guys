import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSessionPayload } from '@/lib/auth-utils'

async function adminOnly(req: NextRequest) {
  const payload = await getSessionPayload(req)
  if (!payload || payload.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = await adminOnly(req)
  if (deny) return deny
  const { id } = await params
  const body    = await req.json()
  const data: Record<string, unknown> = {}
  if (body.active !== undefined) data.active = body.active
  await prisma.coupon.update({ where: { id }, data })
  return NextResponse.json({ ok: true })
}

// Full edit — updates every editable property of an existing coupon rather
// than requiring it to be deleted and recreated.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = await adminOnly(req)
  if (deny) return deny
  const { id } = await params
  const { code, type, value, minOrder, description, usageLimit, expiresAt, active, orderTypes, combinable, combinesWith, applicableCategories } = await req.json()
  if (!code || !type || !description) return NextResponse.json({ error: 'code, type and description required' }, { status: 400 })

  const existing = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } })
  if (existing && existing.id !== id) return NextResponse.json({ error: 'Coupon code already exists' }, { status: 409 })

  const coupon = await prisma.coupon.update({
    where: { id },
    data: {
      code: code.toUpperCase(),
      type,
      value: type === 'fixed' ? Math.round(value * 100) : Math.round(value),
      minOrder: Math.round(minOrder * 100),
      description,
      usageLimit: usageLimit ?? null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      active: active ?? true,
      orderTypes: Array.isArray(orderTypes) ? orderTypes : [],
      combinable: !!combinable,
      combinesWith: combinable && Array.isArray(combinesWith) ? combinesWith.map((c: string) => c.toUpperCase()) : [],
      applicableCategories: Array.isArray(applicableCategories) ? applicableCategories : [],
    },
  })
  return NextResponse.json({
    coupon: {
      id: coupon.id, code: coupon.code, type: coupon.type,
      value: coupon.type === 'fixed' ? coupon.value / 100 : coupon.value,
      minOrder: coupon.minOrder / 100,
      description: coupon.description, active: coupon.active,
      usageCount: coupon.usageCount, usageLimit: coupon.usageLimit,
      expiresAt: coupon.expiresAt,
      orderTypes: coupon.orderTypes, combinable: coupon.combinable, combinesWith: coupon.combinesWith,
      applicableCategories: coupon.applicableCategories,
    },
  })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = await adminOnly(req)
  if (deny) return deny
  const { id } = await params
  await prisma.coupon.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
