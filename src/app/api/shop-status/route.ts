import { NextResponse } from 'next/server'
import { fetchSiteConfig } from '@/lib/site-config'
import { computeShopStatus } from '@/lib/shop-status'

export const dynamic = 'force-dynamic'

export async function GET() {
  const cfg    = await fetchSiteConfig()
  const status = computeShopStatus(cfg)
  return NextResponse.json(status, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
