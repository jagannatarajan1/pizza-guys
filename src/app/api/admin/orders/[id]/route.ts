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

  const { id }     = await params
  const { status } = await req.json()

  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const order = await prisma.order.update({
    where: { id },
    data:  { status },
  })

  emitStatusChanged({ orderNumber: order.orderNumber, status: order.status })

  return NextResponse.json({ status: order.status })
}
