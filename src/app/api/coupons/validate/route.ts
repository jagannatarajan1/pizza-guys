import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { code, subtotal } = await req.json()
  if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 })

  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } })

  if (!coupon || !coupon.active) {
    return NextResponse.json({ error: 'Invalid or inactive coupon code' }, { status: 404 })
  }

  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return NextResponse.json({ error: 'This coupon has expired' }, { status: 400 })
  }

  if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
    return NextResponse.json({ error: 'This coupon has reached its usage limit' }, { status: 400 })
  }

  const subtotalPence = Math.round(subtotal * 100)
  if (subtotalPence < coupon.minOrder) {
    const shortfall = ((coupon.minOrder - subtotalPence) / 100).toFixed(2)
    return NextResponse.json({
      error: `Add £${shortfall} more to your order to use this coupon (minimum order £${(coupon.minOrder / 100).toFixed(2)}, before delivery fee)`,
    }, { status: 400 })
  }

  let discountPence = 0
  if (coupon.type === 'percentage') {
    discountPence = Math.round(subtotalPence * (coupon.value / 100))
  } else if (coupon.type === 'fixed') {
    discountPence = Math.min(coupon.value, subtotalPence)
  }
  // freeDelivery: discount is applied to deliveryFee on the client

  return NextResponse.json({
    valid: true,
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    description: coupon.description,
    discountAmount: discountPence / 100,
    minOrder: coupon.minOrder / 100,
  })
}
