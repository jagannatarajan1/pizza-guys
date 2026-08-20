import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { generateOrderNumber } from '@/lib/utils'
import { getSessionPayload } from '@/lib/auth-utils'
import { requireAuth, sanitizeStr, validatePhone, validatePostcode } from '@/lib/api-guard'
import { priceItem } from '@/lib/order-pricing'
import { resolveDelivery } from '@/lib/delivery'
import { validateCouponSet } from '@/lib/coupons'
import { fetchSiteConfig } from '@/lib/site-config'
import { computeShopStatus } from '@/lib/shop-status'

export async function GET(req: NextRequest) {
  const payload = await getSessionPayload(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orders = await prisma.order.findMany({
    where: {
      userId: payload.userId,
      NOT: { status: 'pending_payment' },
    },
    include: { items: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  // Look up product images for all order items in one query
  const productIds = [...new Set(orders.flatMap((o) => o.items.map((i) => i.productId)))]
  const products   = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, image: true },
  })
  const imageMap = Object.fromEntries(products.map((p) => [p.id, p.image]))

  return NextResponse.json({
    orders: orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      orderType: o.orderType,
      customerName: o.customerName,
      customerEmail: o.customerEmail,
      customerPhone: o.customerPhone,
      deliveryAddress: o.deliveryAddress ? JSON.parse(o.deliveryAddress) : null,
      subtotal: o.subtotal / 100,
      deliveryFee: o.deliveryFee / 100,
      discount: o.discount / 100,
      total: o.total / 100,
      paymentMethod: o.paymentMethod,
      scheduledTime: o.scheduledTime,
      createdAt: o.createdAt,
      items: o.items.map((i) => ({
        productId: i.productId,
        name:      i.productName,
        quantity:  i.quantity,
        unitPrice: i.unitPrice / 100,
        itemTotal: i.itemTotal / 100,
        // Stored as a JSON string of CartItemModifier[] — parsed here so the
        // client never has to know or care about the DB's storage format.
        modifiers: (() => { try { return JSON.parse(i.modifiers || '[]') } catch { return [] } })(),
        specialInstructions: i.specialInstructions,
        image:     imageMap[i.productId] ?? '',
      })),
    })),
  })
}

const MAX_ITEMS    = 50
const MAX_QUANTITY = 99

export async function POST(req: NextRequest) {
  const guard = await requireAuth(req)
  if (!guard.ok) return guard.res

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const {
    orderType,
    customerName,
    customerEmail,
    customerPhone,
    deliveryAddress,
    items,
    couponCodes,
    paymentIntentId,
    paymentMethod,
  } = body

  const nameClean  = sanitizeStr(customerName, 100)
  const emailClean = sanitizeStr(customerEmail, 254)
  const phoneClean = sanitizeStr(customerPhone, 30)

  if (!nameClean) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  if (!phoneClean || !validatePhone(phoneClean))
    return NextResponse.json({ error: 'Valid phone number is required' }, { status: 400 })
  if (!['delivery', 'collection'].includes(orderType))
    return NextResponse.json({ error: 'Invalid order type' }, { status: 400 })
  if (!Array.isArray(items) || items.length === 0 || items.length > MAX_ITEMS)
    return NextResponse.json({ error: 'Invalid items' }, { status: 400 })

  const siteConfig = await fetchSiteConfig()
  const status = computeShopStatus(siteConfig)
  if (!status.isOpen) return NextResponse.json({ error: `We're currently closed — ${status.message}` }, { status: 403 })
  if (orderType === 'delivery' && !status.deliveryEnabled)
    return NextResponse.json({ error: 'Delivery is currently unavailable' }, { status: 403 })
  if (orderType === 'collection' && !status.collectionEnabled)
    return NextResponse.json({ error: 'Collection is currently unavailable' }, { status: 403 })

  type IncomingItem = {
    product?: { id?: string }
    quantity?: number
    modifiers?: unknown
    specialInstructions?: string
  }

  const incoming = items as IncomingItem[]
  const productIds = [...new Set(incoming.map((i) => i.product?.id).filter((id): id is string => !!id))]
  if (productIds.length === 0) return NextResponse.json({ error: 'No valid products' }, { status: 400 })

  const dbProducts = await prisma.product.findMany({
    where: { id: { in: productIds }, available: true },
    select: { id: true, name: true, price: true, category: true, modifiers: true },
  })
  const productMap = Object.fromEntries(dbProducts.map((p) => [p.id, p]))

  let subtotalPence = 0
  const orderItems: {
    productId: string; productName: string; quantity: number
    unitPrice: number; modifiers: string; specialInstructions: string; itemTotal: number
  }[] = []
  const couponItems: { category: string; itemTotalPence: number }[] = []

  for (const item of incoming) {
    const product = productMap[item.product?.id ?? '']
    if (!product) return NextResponse.json({ error: 'Product not found or unavailable' }, { status: 400 })

    const qty = Math.round(Number(item.quantity))
    if (!qty || qty < 1 || qty > MAX_QUANTITY) return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 })

    // Same rulebook the checkout path uses: prices and option rules come from
    // the database, never from the request body.
    const priced = priceItem(product, item.modifiers, qty)
    if (!priced.ok) return NextResponse.json({ error: priced.error }, { status: 400 })

    subtotalPence += priced.itemTotalPence
    orderItems.push({
      productId:           product.id,
      productName:         product.name,
      quantity:            qty,
      unitPrice:           priced.unitPricePence,
      modifiers:           JSON.stringify(priced.modifiers),
      specialInstructions: sanitizeStr(item.specialInstructions, 300),
      itemTotal:           priced.itemTotalPence,
    })
    couponItems.push({ category: product.category, itemTotalPence: priced.itemTotalPence })
  }

  let deliveryFeePence = 0
  if (orderType === 'delivery') {
    const postcode = typeof deliveryAddress === 'object' ? sanitizeStr(deliveryAddress?.postcode, 10) : ''
    const delivery = postcode && validatePostcode(postcode)
      ? await resolveDelivery(postcode, subtotalPence)
      : { available: false as const, reason: 'not_found' as const }
    if (!delivery.available) {
      return NextResponse.json({ error: "We can't deliver to that address — please check your postcode" }, { status: 400 })
    }
    if (subtotalPence < delivery.minOrder) {
      return NextResponse.json({ error: `Minimum order for your area is £${(delivery.minOrder / 100).toFixed(2)}` }, { status: 400 })
    }
    deliveryFeePence = delivery.deliveryFee
  }

  let discountPence = 0
  const requestedCodes = Array.isArray(couponCodes)
    ? couponCodes.filter((c): c is string => typeof c === 'string').map((c) => sanitizeStr(c, 50))
    : []
  if (requestedCodes.length > 0) {
    const result = await validateCouponSet(requestedCodes, couponItems, deliveryFeePence, orderType)
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })
    discountPence = result.discountPence
  }

  const totalPence = Math.max(0, subtotalPence + deliveryFeePence - discountPence)

  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      // Always the signed-in account — an id in the request body is ignored so
      // an order can never be filed against somebody else.
      userId: guard.payload.userId,
      status: 'New',
      orderType,
      customerName:    nameClean,
      customerEmail:   emailClean,
      customerPhone:   phoneClean,
      deliveryAddress: deliveryAddress ? JSON.stringify(deliveryAddress) : null,
      subtotal:        subtotalPence,
      deliveryFee:     deliveryFeePence,
      discount:        discountPence,
      total:           totalPence,
      paymentIntentId: paymentIntentId ?? null,
      paymentMethod,
      items: { create: orderItems },
    },
  })

  return NextResponse.json({ orderNumber: order.orderNumber })
}
