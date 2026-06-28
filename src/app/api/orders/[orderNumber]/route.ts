import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

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
  _req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber } = await params
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: { select: { productName: true, quantity: true, itemTotal: true } } },
  })

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  return NextResponse.json({
    orderNumber: order.orderNumber,
    status: order.status,
    stage: STATUS_STAGE[order.status] ?? 0,
    orderType: order.orderType,
    customerName: order.customerName,
    total: order.total / 100,
    createdAt: order.createdAt,
    items: order.items.map((i) => ({
      name: i.productName,
      quantity: i.quantity,
      itemTotal: i.itemTotal / 100,
    })),
  })
}
