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
  {
    name: 'Choose Your Size', required: true, multiSelect: false, min: 1, max: 1, sortOrder: 0,
    options: {
      create: [
        { name: '9" Personal', price: 0, sortOrder: 0 },
        { name: '12" Medium',  price: 300, sortOrder: 1 },
        { name: '15" Large',   price: 600, sortOrder: 2 },
        { name: '18" XL',      price: 900, sortOrder: 3 },
      ],
    },
  },
  {
    name: 'Choose Your Crust', required: true, multiSelect: false, min: 1, max: 1, sortOrder: 1,
    options: {
      create: [
        { name: 'Thin & Crispy',       price: 0,   sortOrder: 0 },
        { name: 'Classic Hand Tossed', price: 0,   sortOrder: 1 },
        { name: 'Deep Pan',            price: 50,  sortOrder: 2 },
        { name: 'Stuffed Crust',       price: 150, sortOrder: 3 },
      ],
    },
  },
  {
    name: 'Add Extras', required: false, multiSelect: true, min: 0, max: 5, sortOrder: 2,
    options: {
      create: [
        { name: 'Extra Cheese', price: 100, sortOrder: 0 },
        { name: 'Jalapeños',    price: 50,  sortOrder: 1 },
        { name: 'Black Olives', price: 50,  sortOrder: 2 },
      ],
    },
  },
]

function fmtGroup(g: { id: string; name: string; required: boolean; multiSelect: boolean; min: number; max: number; sortOrder: number; options: { id: string; name: string; price: number; sortOrder: number }[] }) {
  return {
    id: g.id, name: g.name, required: g.required, multiSelect: g.multiSelect,
    min: g.min, max: g.max, sortOrder: g.sortOrder,
    options: g.options
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((o) => ({ id: o.id, name: o.name, price: o.price / 100, sortOrder: o.sortOrder })),
  }
}

export async function GET(req: NextRequest) {
  const deny = adminOnly(req)
  if (deny) return deny

  const count = await prisma.modifierGroup.count()
  if (count === 0) {
    for (const s of SEED) await prisma.modifierGroup.create({ data: s })
  }

  const groups = await prisma.modifierGroup.findMany({
    include: { options: true },
    orderBy: { sortOrder: 'asc' },
  })

  return NextResponse.json({ groups: groups.map(fmtGroup) })
}

export async function POST(req: NextRequest) {
  const deny = adminOnly(req)
  if (deny) return deny

  const { name, required, multiSelect, min, max } = await req.json()
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })

  const maxOrder = await prisma.modifierGroup.aggregate({ _max: { sortOrder: true } })
  const group = await prisma.modifierGroup.create({
    data: { name, required: !!required, multiSelect: !!multiSelect, min: min ?? 0, max: max ?? 1, sortOrder: (maxOrder._max.sortOrder ?? -1) + 1 },
    include: { options: true },
  })

  return NextResponse.json({ group: fmtGroup(group) }, { status: 201 })
}
