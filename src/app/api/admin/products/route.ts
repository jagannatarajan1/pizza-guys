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

export async function GET() {
  const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ products })
}

export async function POST(req: NextRequest) {
  const deny = adminOnly(req)
  if (deny) return deny

  const { name, description, price, image, category, popular, available, allergens } = await req.json()
  if (!name || price === undefined || !category) {
    return NextResponse.json({ error: 'name, price and category are required' }, { status: 400 })
  }

  const product = await prisma.product.create({
    data: {
      name,
      description: description ?? '',
      price: Math.round(parseFloat(price) * 100),
      image: image ?? '',
      category,
      popular:   popular   ?? false,
      available: available ?? true,
      allergens: JSON.stringify(allergens ?? []),
    },
  })

  return NextResponse.json({ product }, { status: 201 })
}
