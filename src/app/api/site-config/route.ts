import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { withDefaults } from '@/lib/site-config'

export async function GET() {
  const rows = await prisma.siteConfig.findMany()
  const config: Record<string, string> = {}
  rows.forEach((r) => { config[r.key] = r.value })
  return NextResponse.json({ config: withDefaults(config) })
}
