import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireStaff } from '@/lib/api-guard'
import { emitStatusChanged } from '@/lib/order-events'

const VALID_STATUSES = [
  'confirmed', 'New', 'Accepted', 'Preparing', 'Ready',
  'Out for Delivery', 'Completed', 'Cancelled',
]

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireStaff(req)
  if (!guard.ok) return guard.res

  const { id }                  = await params
  const { status, prepMinutes } = await req.json()

  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  // Accepting an order is also when its preparation clock starts — the two
  // are written together so an accepted order can never exist without the
  // timing the auto-progress scanner needs to move it along.
  const data: { status: string; acceptedAt?: Date; prepMinutes?: number } = { status }
  if (status === 'Accepted') {
    const mins = Number(prepMinutes)
    if (!Number.isInteger(mins) || mins < 1 || mins > 360) {
      return NextResponse.json(
        { error: 'Choose a preparation time between 1 and 360 minutes to accept this order' },
        { status: 400 }
      )
    }
    data.acceptedAt  = new Date()
    data.prepMinutes = mins
  }

  const order = await prisma.order.update({ where: { id }, data })

  emitStatusChanged({ orderNumber: order.orderNumber, status: order.status })

  return NextResponse.json({
    status:      order.status,
    acceptedAt:  order.acceptedAt,
    prepMinutes: order.prepMinutes,
  })
}
