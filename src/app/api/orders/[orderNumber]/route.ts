import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, AUTH_COOKIE } from '@/lib/auth-utils'

export const dynamic = 'force-dynamic'

const STATUS_STAGE: Record<string, number> = {
  pending_payment:    0,
  confirmed:          0,
  New:                0,
  Accepted:           1,
  Preparing:          2,
  Ready:              3,
  'Out for Delivery': 3,
  Completed:          4,
  Cancelled:          -1,
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber } = await params
  if (!orderNumber || orderNumber.length > 20) {
    return NextResponse.json({ error: 'Invalid order number' }, { status: 400 })
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: { select: { productId: true, productName: true, quantity: true, itemTotal: true } } },
  })

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  // Fetch product images in one query
  const productIds = [...new Set(order.items.map((i) => i.productId))]
  const products   = await prisma.product.findMany({
    where:  { id: { in: productIds } },
    select: { id: true, image: true },
  })
  const imageMap = Object.fromEntries(products.map((p) => [p.id, p.image]))

  // Check if the requester is the order owner or an admin/staff/viewer
  const token   = req.cookies.get(AUTH_COOKIE)?.value
  const payload = token ? verifyToken(token) : null
  const isOwner = payload?.userId && order.userId === payload.userId
  const isStaff = payload && ['admin', 'staff', 'viewer'].includes(payload.role)

  // Mask customer name for unauthenticated / non-owner requests
  const visibleName = (isOwner || isStaff)
    ? order.customerName
    : order.customerName.split(' ')[0] + ' ' + (order.customerName.split(' ').slice(1).map(() => '•').join(' ') || '')

  return NextResponse.json({
    orderNumber:  order.orderNumber,
    status:       order.status,
    stage:        STATUS_STAGE[order.status] ?? 0,
    orderType:    order.orderType,
    customerName: visibleName,
    total:        order.total / 100,
    createdAt:    order.createdAt,
    items: order.items.map((i) => ({
      name:      i.productName,
      quantity:  i.quantity,
      itemTotal: i.itemTotal / 100,
      image:     imageMap[i.productId] ?? '',
    })),
  })
}
