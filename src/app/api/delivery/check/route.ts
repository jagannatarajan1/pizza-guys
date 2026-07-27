import { NextRequest, NextResponse } from 'next/server'
import { resolveDelivery } from '@/lib/delivery'
import { isValidPostcode } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const postcode = typeof body?.postcode === 'string' ? body.postcode.trim() : ''
  const subtotalPence = Math.round((Number(body?.subtotal) || 0) * 100)

  if (!postcode || !isValidPostcode(postcode)) {
    return NextResponse.json({ error: 'Enter a valid UK postcode (e.g. SW1A 1AA)' }, { status: 400 })
  }

  const result = await resolveDelivery(postcode, subtotalPence)

  if (!result.available) {
    // A lookup outage is our fault, not a bad address — say so honestly and
    // answer 503 so the UI can invite a retry instead of telling someone with
    // a perfectly good postcode that we don't deliver to them. A distance with
    // no matching fee band is the same kind of our-fault gap (e.g. bands only
    // configured from 1 mile up, so the shop's own 0-mile address falls
    // through) — never let a band-table gap look like "you're too far away".
    if (result.reason === 'lookup_failed' || result.reason === 'misconfigured') {
      return NextResponse.json(
        { available: false, retryable: true, message: "We couldn't check your postcode just now — please try again in a moment" },
        { status: 503 }
      )
    }
    if (result.reason === 'no_band') {
      return NextResponse.json(
        { available: false, retryable: true, message: "We're having trouble calculating delivery pricing for your area — please try again shortly, or call us to place your order" },
        { status: 503 }
      )
    }
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
    freeDeliveryApplied: result.freeDeliveryApplied,
    freeDeliveryThreshold: result.freeDeliveryThreshold / 100,
  })
}
