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

type DbGroup = {
  id: string; name: string; description: string
  required: boolean; multiSelect: boolean; min: number; max: number
  maxPerOption: number; sortOrder: number
  dependsOnGroup: string | null; dependsOnOptions: string; priceDependsOn: string | null
  options: { id: string; name: string; price: number; tag: string; priceBy: string; sortOrder: number }[]
}

// Admin saves a product by writing these very objects into the product's
// modifier JSON, so every field the picker relies on has to survive the round
// trip — dropping one here would silently strip step dependencies or
// size-based pricing the next time someone edited a pizza.
function fmtGroup(g: DbGroup) {
  let dependsOnOptions: string[] = []
  try {
    const parsed = JSON.parse(g.dependsOnOptions || '[]')
    if (Array.isArray(parsed)) dependsOnOptions = parsed.filter((x): x is string => typeof x === 'string')
  } catch { dependsOnOptions = [] }

  return {
    id: g.id, name: g.name, description: g.description,
    required: g.required, multiSelect: g.multiSelect,
    min: g.min, max: g.max, maxPerOption: g.maxPerOption, sortOrder: g.sortOrder,
    ...(g.dependsOnGroup ? { dependsOn: { groupId: g.dependsOnGroup, optionIds: dependsOnOptions } } : {}),
    ...(g.priceDependsOn ? { priceDependsOn: g.priceDependsOn } : {}),
    options: g.options
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((o) => {
        let priceBy: Record<string, number> | undefined
        try {
          const parsed = JSON.parse(o.priceBy || '{}')
          if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
            priceBy = Object.fromEntries(Object.entries(parsed).map(([k, v]) => [k, Number(v) / 100]))
          }
        } catch { priceBy = undefined }
        return {
          id: o.id, name: o.name, price: o.price / 100, sortOrder: o.sortOrder,
          ...(o.tag ? { tag: o.tag } : {}),
          ...(priceBy ? { priceBy } : {}),
        }
      }),
  }
}

export async function GET(req: NextRequest) {
  const deny = await adminOnly(req)
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
  const deny = await adminOnly(req)
  if (deny) return deny

  const { name, description, required, multiSelect, min, max, maxPerOption } = await req.json()
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })

  const maxOrder = await prisma.modifierGroup.aggregate({ _max: { sortOrder: true } })
  const group = await prisma.modifierGroup.create({
    data: {
      name,
      description: typeof description === 'string' ? description : '',
      required: !!required, multiSelect: !!multiSelect,
      min: min ?? 0, max: max ?? 1,
      maxPerOption: Math.max(1, Number(maxPerOption) || 1),
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
    include: { options: true },
  })

  return NextResponse.json({ group: fmtGroup(group) }, { status: 201 })
}
