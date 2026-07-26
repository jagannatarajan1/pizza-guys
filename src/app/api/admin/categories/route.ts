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

export async function GET(req: NextRequest) {
  const deny = await adminOnly(req)
  if (deny) return deny
  const categories = await prisma.category.findMany({ orderBy: { order: 'asc' } })
  return NextResponse.json({ categories })
}

export async function POST(req: NextRequest) {
  const deny = await adminOnly(req)
  if (deny) return deny

  const { name, icon, image, visible } = await req.json()
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const slug  = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const id    = slug
  const count = await prisma.category.count()

  const category = await prisma.category.create({
    data: { id, name, slug, icon: icon ?? '🍽️', image: image ?? '', visible: visible ?? true, order: count + 1 },
  })
  return NextResponse.json({ category }, { status: 201 })
}
