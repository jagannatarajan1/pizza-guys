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

function normalize(p: { price: number; modifiers: string; allergens: string; [k: string]: unknown }) {
  return { ...p, price: p.price / 100, modifiers: JSON.parse(p.modifiers || '[]'), allergens: JSON.parse(p.allergens || '[]') }
}

export async function GET(req: NextRequest) {
  const deny = await adminOnly(req)
  if (deny) return deny
  const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ products: products.map(normalize) })
}

export async function POST(req: NextRequest) {
  const deny = await adminOnly(req)
  if (deny) return deny

  const { name, description, price, image, category, popular, available, allergens, modifiers } = await req.json()
  if (!name || price === undefined || !category) {
    return NextResponse.json({ error: 'name, price and category are required' }, { status: 400 })
  }

  const product = await prisma.product.create({
    data: {
      name,
      description: description ?? '',
      price:     Math.round(parseFloat(price) * 100),
      image:     image     ?? '',
      category,
      popular:   popular   ?? false,
      available: available ?? true,
      allergens: JSON.stringify(allergens ?? []),
      modifiers: JSON.stringify(modifiers ?? []),
    },
  })

  return NextResponse.json({ product: normalize(product) }, { status: 201 })
}
