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

export async function GET(req: NextRequest) {
  const deny = adminOnly(req)
  if (deny) return deny
  const categories = await prisma.category.findMany({ orderBy: { order: 'asc' } })
  return NextResponse.json({ categories })
}

export async function POST(req: NextRequest) {
  const deny = adminOnly(req)
  if (deny) return deny

  const { name, icon, visible } = await req.json()
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const slug  = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const id    = slug
  const count = await prisma.category.count()

  const category = await prisma.category.create({
    data: { id, name, slug, icon: icon ?? '🍽️', visible: visible ?? true, order: count + 1 },
  })
  return NextResponse.json({ category }, { status: 201 })
}
