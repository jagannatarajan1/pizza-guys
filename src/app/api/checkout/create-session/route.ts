import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe-server'
import prisma from '@/lib/prisma'
import { generateOrderNumber } from '@/lib/utils'
import { requireAuth, sanitizeStr, validateEmail, validatePhone, getOriginFromRequest } from '@/lib/api-guard'
import { fetchSiteConfig } from '@/lib/site-config'
import { computeShopStatus } from '@/lib/shop-status'
import { resolveDelivery } from '@/lib/delivery'

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
  const guard = requireAuth(req)
  if (!guard.ok) return guard.res
  const authUserId = guard.payload.userId

  const origin = getOriginFromRequest(req)
  const body   = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const {
    orderType, customerName, customerEmail, customerPhone,
    deliveryAddress, items, couponCode, scheduledTime,
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

  // Orders placed for right now must respect the shop's current open/closed
  // status — a scheduled order for later is exempt from this "right now" check.
  if (!scheduledTime) {
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
  }

  // ── Server-side price recalculation ────────────────────────────────────────
  // NEVER trust client-provided prices — always fetch from DB
  const productIds = [...new Set((items as CartItem[]).map((i) => i.product?.id).filter(Boolean))]
  if (productIds.length === 0) return NextResponse.json({ error: 'No valid products' }, { status: 400 })

  const dbProducts = await prisma.product.findMany({
    where: { id: { in: productIds }, available: true },
    select: { id: true, name: true, price: true },
  })
  const productMap = Object.fromEntries(dbProducts.map((p) => [p.id, p]))

  let serverSubtotalPence = 0
  const validatedItems: {
    productId: string; productName: string; quantity: number
    unitPrice: number; modifiers: string; specialInstructions: string; itemTotal: number
  }[] = []

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
  }

  // ── Delivery fee from distance, never trust the client's postcode/fee ──────
  let serverDeliveryFeePence = 0
  if (orderType === 'delivery') {
    const postcode = typeof deliveryAddress === 'object' ? sanitizeStr(deliveryAddress?.postcode, 10) : ''
    const delivery = postcode ? await resolveDelivery(postcode) : { available: false as const, reason: 'not_found' as const }
    if (!delivery.available) {
      return NextResponse.json({ error: "We can't deliver to that address — please check your postcode" }, { status: 400 })
    }
    if (serverSubtotalPence < delivery.minOrder) {
      return NextResponse.json({ error: `Minimum order for your area is £${(delivery.minOrder / 100).toFixed(2)}` }, { status: 400 })
    }
    serverDeliveryFeePence = delivery.deliveryFee
  }

  // ── Coupon validation ───────────────────────────────────────────────────────
  let serverDiscountPence = 0
  let usedCoupon = null
  if (couponCode) {
    const coupon = await prisma.coupon.findFirst({
      where: {
        code:   sanitizeStr(couponCode, 50).toUpperCase(),
        active: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    }).catch(() => null)

    // Apply coupon only if usage limit not reached and subtotal meets minimum
    const withinUsageLimit = !coupon?.usageLimit || coupon.usageCount < coupon.usageLimit
    if (coupon && withinUsageLimit && serverSubtotalPence >= coupon.minOrder) {
      if (coupon.type === 'percentage') {
        serverDiscountPence = Math.round(serverSubtotalPence * coupon.value / 100)
      } else if (coupon.type === 'fixed') {
        serverDiscountPence = Math.min(coupon.value, serverSubtotalPence)
      } else if (coupon.type === 'freeDelivery') {
        serverDiscountPence = serverDeliveryFeePence
      }
      usedCoupon = coupon
    }
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
      scheduledTime:   scheduledTime ? new Date(scheduledTime) : null,
      items:           { create: validatedItems },
    },
  })

  // Increment coupon usage
  if (usedCoupon) {
    await prisma.coupon.update({
      where: { id: usedCoupon.id },
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
