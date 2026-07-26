import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSessionPayload } from '@/lib/auth-utils'
import { withDefaults, sanitizeConfigValue } from '@/lib/site-config'

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

  const rows = await prisma.siteConfig.findMany()
  const config: Record<string, string> = {}
  rows.forEach((r) => { config[r.key] = r.value })
  return NextResponse.json({ config: withDefaults(config) })
}

export async function PUT(req: NextRequest) {
  const deny = await adminOnly(req)
  if (deny) return deny

  const body = await req.json().catch(() => null)
  if (!body || typeof body.updates !== 'object' || Array.isArray(body.updates)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const updates = body.updates as Record<string, string>

  // Sanitize every value before writing to DB
  const sanitized: Record<string, string> = {}
  for (const [key, raw] of Object.entries(updates)) {
    if (typeof raw !== 'string') continue
    sanitized[key] = sanitizeConfigValue(key, raw)
  }

  await Promise.all(
    Object.entries(sanitized).map(([key, value]) =>
      prisma.siteConfig.upsert({
        where:  { key },
        update: { value },
        create: { key, value },
      })
    )
  )

  const rows = await prisma.siteConfig.findMany()
  const config: Record<string, string> = {}
  rows.forEach((r) => { config[r.key] = r.value })
  return NextResponse.json({ ok: true, config: withDefaults(config) })
}
