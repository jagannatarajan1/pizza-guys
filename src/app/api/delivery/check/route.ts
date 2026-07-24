import { NextRequest, NextResponse } from 'next/server'
import { resolveDelivery } from '@/lib/delivery'
import { isValidPostcode } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const postcode = typeof body?.postcode === 'string' ? body.postcode.trim() : ''

  if (!postcode || !isValidPostcode(postcode)) {
    return NextResponse.json({ error: 'Enter a valid UK postcode (e.g. SW1A 1AA)' }, { status: 400 })
  }

  const result = await resolveDelivery(postcode)

  if (!result.available) {
    const message = result.reason === 'not_found'
      ? "We couldn't recognise that postcode — please double-check it"
      : "Sorry, that's outside our delivery area"
    return NextResponse.json({
      available: false,
      message,
      distanceMiles: 'distanceMiles' in result ? Math.round((result.distanceMiles ?? 0) * 10) / 10 : null,
    })
  }

  return NextResponse.json({
    available: true,
    distanceMiles: Math.round(result.distanceMiles * 10) / 10,
    minOrder: result.minOrder / 100,
    deliveryFee: result.deliveryFee / 100,
  })
}
