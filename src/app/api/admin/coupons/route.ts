import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSessionPayload } from '@/lib/auth-utils'
import type { Coupon } from '@prisma/client'

async function adminOnly(req: NextRequest) {
  const payload = await getSessionPayload(req)
  if (!payload || payload.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}

export const dynamic = 'force-dynamic'

const SEED = [
  { code: 'PIZZA10',    type: 'percentage',   value: 10, minOrder: 1500, description: '10% off orders over £15' },
  { code: 'FIRSTORDER', type: 'fixed',        value: 500, minOrder: 2000, description: '£5 off your first order' },
  { code: 'FREEDEL',    type: 'freeDelivery', value: 0,  minOrder: 2000, description: 'Free delivery on orders over £20' },
]

async function ensureSeeded() {
  const count = await prisma.coupon.count()
  if (count === 0) await prisma.coupon.createMany({ data: SEED })
}

function fmt(c: Coupon) {
  return {
    id: c.id, code: c.code, type: c.type,
    value: c.type === 'fixed' ? c.value / 100 : c.value,
    minOrder: c.minOrder / 100,
    description: c.description, active: c.active,
    usageCount: c.usageCount, usageLimit: c.usageLimit,
    expiresAt: c.expiresAt,
    orderTypes: c.orderTypes,
    combinable: c.combinable,
    combinesWith: c.combinesWith,
    applicableCategories: c.applicableCategories,
  }
}

export async function GET(req: NextRequest) {
  const deny = await adminOnly(req)
  if (deny) return deny
  await ensureSeeded()
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ coupons: coupons.map(fmt) })
}

export async function POST(req: NextRequest) {
  const deny = await adminOnly(req)
  if (deny) return deny
  const { code, type, value, minOrder, description, usageLimit, expiresAt, orderTypes, combinable, combinesWith, applicableCategories } = await req.json()
  if (!code || !type || !description) return NextResponse.json({ error: 'code, type and description required' }, { status: 400 })
  const existing = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } })
  if (existing) return NextResponse.json({ error: 'Coupon code already exists' }, { status: 409 })
  const coupon = await prisma.coupon.create({
    data: {
      code: code.toUpperCase(),
      type,
      value: type === 'fixed' ? Math.round(value * 100) : Math.round(value),
      minOrder: Math.round(minOrder * 100),
      description,
      usageLimit: usageLimit ?? null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      orderTypes: Array.isArray(orderTypes) ? orderTypes : [],
      combinable: !!combinable,
      combinesWith: combinable && Array.isArray(combinesWith) ? combinesWith.map((c: string) => c.toUpperCase()) : [],
      applicableCategories: Array.isArray(applicableCategories) ? applicableCategories : [],
    },
  })
  return NextResponse.json({ coupon: fmt(coupon) }, { status: 201 })
}
