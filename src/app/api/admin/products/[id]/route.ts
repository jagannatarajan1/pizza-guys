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

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = adminOnly(req)
  if (deny) return deny

  const { id } = await params
  const { name, description, price, image, category, popular, available, allergens } = await req.json()

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...(name        !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(price       !== undefined && { price: Math.round(parseFloat(price) * 100) }),
      ...(image       !== undefined && { image }),
      ...(category    !== undefined && { category }),
      ...(popular     !== undefined && { popular }),
      ...(available   !== undefined && { available }),
      ...(allergens   !== undefined && { allergens: JSON.stringify(allergens) }),
    },
  })

  return NextResponse.json({ product })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = adminOnly(req)
  if (deny) return deny

  const { id } = await params
  await prisma.product.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
