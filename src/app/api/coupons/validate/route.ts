import { NextRequest, NextResponse } from 'next/server'
import { validateCouponSet, type CouponCartItem } from '@/lib/coupons'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const codes = Array.isArray(body?.codes) ? body.codes : typeof body?.code === 'string' ? [body.code] : []
  const orderType = body?.orderType === 'collection' ? 'collection' : 'delivery'
  const deliveryFeePence = Math.round((Number(body?.deliveryFee) || 0) * 100)

  // Preferred shape is a per-item list (needed for category-restricted
  // coupons). Fall back to a plain subtotal so an older page still open in
  // someone's browser keeps working instead of silently seeing every coupon
  // rejected for "minimum order not met" against a £0 cart.
  const items: CouponCartItem[] = Array.isArray(body?.items) && body.items.length > 0
    ? body.items.map((i: { category?: unknown; itemTotal?: unknown }) => ({
        category: typeof i?.category === 'string' ? i.category : '',
        itemTotalPence: Math.round((Number(i?.itemTotal) || 0) * 100),
      }))
    : [{ category: '', itemTotalPence: Math.round((Number(body?.subtotal) || 0) * 100) }]

  if (codes.length === 0) return NextResponse.json({ error: 'Code required' }, { status: 400 })

  const result = await validateCouponSet(codes, items, deliveryFeePence, orderType)
  if (!result.ok) return NextResponse.json({ error: result.error, code: result.code }, { status: 400 })

  return NextResponse.json({
    valid: true,
    discountAmount: result.discountPence / 100,
    coupons: result.coupons.map((c) => ({
      code: c.code,
      type: c.type,
      value: c.type === 'fixed' ? c.value / 100 : c.value,
      description: c.description,
      minOrder: c.minOrder / 100,
      orderTypes: c.orderTypes,
      combinable: c.combinable,
      combinesWith: c.combinesWith,
      applicableCategories: c.applicableCategories,
    })),
  })
}
