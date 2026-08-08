import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe-server'
import prisma from '@/lib/prisma'
import { generateOrderNumber } from '@/lib/utils'
import { requireAuth, sanitizeStr, validateEmail, validatePhone, validatePostcode, getOriginFromRequest } from '@/lib/api-guard'
import { fetchSiteConfig } from '@/lib/site-config'
import { computeShopStatus } from '@/lib/shop-status'
import { resolveDelivery } from '@/lib/delivery'
import { validateCouponSet } from '@/lib/coupons'

const MAX_ITEMS    = 50
const MAX_QUANTITY = 99

type CartItem = {
  product: { id: string }
  quantity: number
  modifiers: { id: string; name: string; price: number }[]
  specialInstructions: string
}

export async function POST(req: NextRequest) {
  // Must be logged in to place an order
  const guard = await requireAuth(req)
  if (!guard.ok) return guard.res
  const authUserId = guard.payload.userId

  const origin = getOriginFromRequest(req)
  const body   = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const {
    orderType, customerName, customerEmail, customerPhone,
    deliveryAddress, items, couponCodes,
  } = body

  // ── Basic input validation ──────────────────────────────────────────────────
  const nameClean  = sanitizeStr(customerName, 100)
  const emailClean = sanitizeStr(customerEmail, 254)
  const phoneClean = sanitizeStr(customerPhone, 30)

  if (!nameClean)  return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  if (!phoneClean || !validatePhone(phoneClean))
    return NextResponse.json({ error: 'Valid phone number is required' }, { status: 400 })
  if (!['delivery', 'collection'].includes(orderType))
    return NextResponse.json({ error: 'Invalid order type' }, { status: 400 })
  if (!Array.isArray(items) || items.length === 0 || items.length > MAX_ITEMS)
    return NextResponse.json({ error: 'Invalid items' }, { status: 400 })

  // Every order is for right now, so the shop's open/closed status always
  // applies. This is deliberately unconditional — there's no scheduling, and
  // no request field may skip it.
  const siteConfig = await fetchSiteConfig()
  const status = computeShopStatus(siteConfig)
  if (!status.isOpen) {
    return NextResponse.json({ error: `We're currently closed — ${status.message}` }, { status: 403 })
  }
  if (orderType === 'delivery' && !status.deliveryEnabled) {
    return NextResponse.json({ error: 'Delivery is currently unavailable' }, { status: 403 })
  }
  if (orderType === 'collection' && !status.collectionEnabled) {
    return NextResponse.json({ error: 'Collection is currently unavailable' }, { status: 403 })
  }

  // ── Server-side price recalculation ────────────────────────────────────────
  // NEVER trust client-provided prices — always fetch from DB
  const productIds = [...new Set((items as CartItem[]).map((i) => i.product?.id).filter(Boolean))]
  if (productIds.length === 0) return NextResponse.json({ error: 'No valid products' }, { status: 400 })

  const dbProducts = await prisma.product.findMany({
    where: { id: { in: productIds }, available: true },
    select: { id: true, name: true, price: true, category: true },
  })
  const productMap = Object.fromEntries(dbProducts.map((p) => [p.id, p]))

  let serverSubtotalPence = 0
  const validatedItems: {
    productId: string; productName: string; quantity: number
    unitPrice: number; modifiers: string; specialInstructions: string; itemTotal: number
  }[] = []
  const couponItems: { category: string; itemTotalPence: number }[] = []

  for (const item of items as CartItem[]) {
    const product = productMap[item.product?.id]
    if (!product) return NextResponse.json({ error: `Product not found or unavailable: ${item.product?.id}` }, { status: 400 })

    const qty = Math.round(item.quantity)
    if (!qty || qty < 1 || qty > MAX_QUANTITY) return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 })

    const unitPricePence = product.price // DB price is already in pence
    const itemTotalPence = unitPricePence * qty
    serverSubtotalPence += itemTotalPence

    validatedItems.push({
      productId:           product.id,
      productName:         product.name,
      quantity:            qty,
      unitPrice:           unitPricePence,
      modifiers:           JSON.stringify(Array.isArray(item.modifiers) ? item.modifiers : []),
      specialInstructions: sanitizeStr(item.specialInstructions, 300),
      itemTotal:           itemTotalPence,
    })
    couponItems.push({ category: product.category, itemTotalPence })
  }

  // ── Delivery fee from distance, never trust the client's postcode/fee ──────
  let serverDeliveryFeePence = 0
  if (orderType === 'delivery') {
    const postcode = typeof deliveryAddress === 'object' ? sanitizeStr(deliveryAddress?.postcode, 10) : ''
    // Screen the format here so obviously-malformed input fails fast instead of
    // spending an external lookup that would only ever come back not-found.
    const delivery = postcode && validatePostcode(postcode)
      ? await resolveDelivery(postcode, serverSubtotalPence)
      : { available: false as const, reason: 'not_found' as const }
    if (!delivery.available) {
      // Never blame the customer's address for our own outage — that turns a
      // transient lookup failure into a lost order and a confused customer.
      // A distance with no matching fee band is the same kind of our-fault
      // gap (e.g. bands only configured from 1 mile up, so the shop's own
      // 0-mile address falls through) — it is never the customer's postcode
      // at fault, so it must never be told to "check your postcode".
      if (delivery.reason === 'lookup_failed' || delivery.reason === 'misconfigured') {
        return NextResponse.json(
          { error: "We couldn't verify your delivery address just now — please try again in a moment" },
          { status: 503 }
        )
      }
      if (delivery.reason === 'no_band') {
        return NextResponse.json(
          { error: "We're having trouble calculating delivery pricing for your area — please try again shortly, or call us to place your order" },
          { status: 503 }
        )
      }
      return NextResponse.json({ error: "We can't deliver to that address — please check your postcode" }, { status: 400 })
    }
    if (serverSubtotalPence < delivery.minOrder) {
      return NextResponse.json({ error: `Minimum order for your area is £${(delivery.minOrder / 100).toFixed(2)}` }, { status: 400 })
    }
    serverDeliveryFeePence = delivery.deliveryFee
  }

  // ── Coupon validation ───────────────────────────────────────────────────────
  // Never trust client-provided discount amounts — only the codes are used,
  // everything else (eligibility, combination rules, discount) is recomputed
  // here from scratch using the same logic the customer-facing preview uses.
  let serverDiscountPence = 0
  let usedCoupons: { id: string }[] = []
  const requestedCodes = Array.isArray(couponCodes)
    ? couponCodes.filter((c): c is string => typeof c === 'string').map((c) => sanitizeStr(c, 50))
    : []
  if (requestedCodes.length > 0) {
    const result = await validateCouponSet(requestedCodes, couponItems, serverDeliveryFeePence, orderType)
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    serverDiscountPence = result.discountPence
    usedCoupons = result.coupons
  }

  const serverTotalPence = Math.max(0, serverSubtotalPence + serverDeliveryFeePence - serverDiscountPence)

  if (serverTotalPence < 50) {
    return NextResponse.json({ error: 'Order total is too low (minimum 50p)' }, { status: 400 })
  }

  // ── Create order with server-calculated prices ──────────────────────────────
  const order = await prisma.order.create({
    data: {
      orderNumber:     generateOrderNumber(),
      userId:          authUserId, // use server-verified userId, never client-provided
      status:          'pending_payment',
      orderType,
      customerName:    nameClean,
      customerEmail:   emailClean,
      customerPhone:   phoneClean,
      deliveryAddress: deliveryAddress ? JSON.stringify(deliveryAddress) : null,
      subtotal:        serverSubtotalPence,
      deliveryFee:     serverDeliveryFeePence,
      discount:        serverDiscountPence,
      total:           serverTotalPence,
      paymentMethod:   'card',
      items:           { create: validatedItems },
    },
  })

  // Increment coupon usage for every coupon actually applied
  if (usedCoupons.length > 0) {
    await prisma.coupon.updateMany({
      where: { id: { in: usedCoupons.map((c) => c.id) } },
      data:  { usageCount: { increment: 1 } },
    })
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency:     'gbp',
          unit_amount:  serverTotalPence, // server-calculated, never client-provided
          product_data: {
            name:        `Pizza Guys Order #${order.orderNumber}`,
            description: `${validatedItems.length} item${validatedItems.length !== 1 ? 's' : ''} · ${orderType === 'delivery' ? 'Delivery' : 'Collection'}`,
          },
        },
      },
    ],
    ...(emailClean && validateEmail(emailClean) ? { customer_email: emailClean } : {}),
    metadata:    { orderId: order.id, orderNumber: order.orderNumber, userId: authUserId },
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${origin}/checkout?cancelled=1`,
    expires_at:  Math.floor(Date.now() / 1000) + 30 * 60, // session expires in 30 min
  })

  await prisma.order.update({
    where: { id: order.id },
    data:  { paymentIntentId: session.id },
  })

  return NextResponse.json({ url: session.url })
}
