import prisma from './prisma'
import type { Coupon } from '@prisma/client'

export type OrderType = 'delivery' | 'collection'
export type CouponCartItem = { category: string; itemTotalPence: number }

export function isOrderTypeAllowed(coupon: Pick<Coupon, 'orderTypes'>, orderType: OrderType): boolean {
  return coupon.orderTypes.length === 0 || coupon.orderTypes.includes(orderType)
}

// The subtotal a coupon actually applies to — the whole cart, unless the
// admin restricted it to specific categories (e.g. "10% off pizzas"), in
// which case only matching items count toward both the minimum spend and
// the discount itself.
export function qualifyingSubtotalPence(coupon: Pick<Coupon, 'applicableCategories'>, items: CouponCartItem[]): number {
  if (coupon.applicableCategories.length === 0) return items.reduce((sum, i) => sum + i.itemTotalPence, 0)
  return items
    .filter((i) => coupon.applicableCategories.includes(i.category))
    .reduce((sum, i) => sum + i.itemTotalPence, 0)
}

export function computeCouponDiscountPence(
  coupon: Pick<Coupon, 'type' | 'value' | 'applicableCategories'>,
  items: CouponCartItem[],
  deliveryFeePence: number,
  orderType: OrderType
): number {
  const qualifying = qualifyingSubtotalPence(coupon, items)
  if (coupon.type === 'percentage') return Math.round(qualifying * coupon.value / 100)
  if (coupon.type === 'fixed') return Math.min(coupon.value, qualifying)
  if (coupon.type === 'freeDelivery') return orderType === 'delivery' ? deliveryFeePence : 0
  return 0
}

// A pair can only combine if BOTH sides explicitly list the other's code —
// this forces an admin to configure the pairing from both coupons rather
// than one coupon silently allowing itself to be stacked with another that
// never opted in to it.
function canCombine(a: Coupon, b: Coupon): boolean {
  if (!a.combinable || !b.combinable) return false
  return a.combinesWith.includes(b.code) && b.combinesWith.includes(a.code)
}

export type CouponValidationResult =
  | { ok: true; coupons: Coupon[]; discountPence: number }
  | { ok: false; error: string; code?: string }

// Single source of truth for "are these coupon codes usable together, right
// now, on this cart" — used by both the customer-facing preview endpoint and
// the real checkout redemption, so the two can never silently disagree.
export async function validateCouponSet(
  codes: string[],
  items: CouponCartItem[],
  deliveryFeePence: number,
  orderType: OrderType
): Promise<CouponValidationResult> {
  const uniqueCodes = [...new Set(codes.map((c) => c.trim().toUpperCase()).filter(Boolean))]
  if (uniqueCodes.length === 0) return { ok: true, coupons: [], discountPence: 0 }

  const found = await prisma.coupon.findMany({ where: { code: { in: uniqueCodes } } })
  const now = new Date()
  const subtotalPence = items.reduce((sum, i) => sum + i.itemTotalPence, 0)

  for (const code of uniqueCodes) {
    const coupon = found.find((c) => c.code === code)
    if (!coupon || !coupon.active) return { ok: false, error: `Coupon "${code}" is not valid`, code }
    if (coupon.expiresAt && coupon.expiresAt < now) return { ok: false, error: `Coupon "${code}" has expired`, code }
    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit)
      return { ok: false, error: `Coupon "${code}" has reached its usage limit`, code }
    const qualifying = qualifyingSubtotalPence(coupon, items)
    if (qualifying < coupon.minOrder) {
      const scope = coupon.applicableCategories.length > 0 ? ' on eligible items' : ''
      return { ok: false, error: `Coupon "${code}" needs a minimum order of £${(coupon.minOrder / 100).toFixed(2)}${scope}`, code }
    }
    if (!isOrderTypeAllowed(coupon, orderType))
      return { ok: false, error: `Coupon "${code}" isn't valid for ${orderType}`, code }
  }

  if (uniqueCodes.length > 1) {
    for (let i = 0; i < found.length; i++) {
      for (let j = i + 1; j < found.length; j++) {
        if (!canCombine(found[i], found[j])) {
          return { ok: false, error: `"${found[i].code}" and "${found[j].code}" can't be combined` }
        }
      }
    }
  }

  const discountPence = found.reduce(
    (sum, c) => sum + computeCouponDiscountPence(c, items, deliveryFeePence, orderType),
    0
  )
  // Never let a stack of coupons discount more than the order is worth.
  const cappedDiscount = Math.min(discountPence, subtotalPence + (orderType === 'delivery' ? deliveryFeePence : 0))

  return { ok: true, coupons: found, discountPence: cappedDiscount }
}
