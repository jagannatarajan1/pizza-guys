import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireStaff, sanitizeStr } from '@/lib/api-guard'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { emitOrderMessage } from '@/lib/order-events'
import { logAuditEvent } from '@/lib/audit-log'

// Orders in either of these states have nothing left to message a customer
// about — matches the "till the order completed fully" cutoff.
const TERMINAL_STATUSES = ['Completed', 'Cancelled']

// Sends a free-text update to the customer on an active order — delivered by
// appending to the order's message log, which the customer's already-open
// /order-tracking page picks up live over its existing SSE connection (see
// emitOrderMessage). No email/SMS channel; see order-events.ts for why.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireStaff(req)
  if (!guard.ok) return guard.res

  const ip = getClientIp(req as unknown as Request)
  const rl = rateLimit(`order-message:${guard.payload.userId}`, 30, 15 * 60 * 1000)
  if (rl.limited) {
    return NextResponse.json({ error: 'Too many messages sent. Try again shortly.' }, { status: 429 })
  }

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const message = sanitizeStr(body.message, 500)
  if (!message) return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 })

  const order = await prisma.order.findUnique({ where: { id }, select: { id: true, orderNumber: true, status: true } })
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  if (TERMINAL_STATUSES.includes(order.status)) {
    return NextResponse.json(
      { error: 'This order is already complete — no further messages can be sent.' },
      { status: 400 }
    )
  }

  const created = await prisma.orderMessage.create({
    data: { orderId: order.id, message, createdBy: guard.payload.email },
  })

  await logAuditEvent({
    userId: guard.payload.userId,
    email:  guard.payload.email,
    action: 'order_message_sent',
    detail: `order ${order.orderNumber}`,
    ip,
  })

  emitOrderMessage({ orderNumber: order.orderNumber })

  return NextResponse.json({
    message: { id: created.id, message: created.message, createdBy: created.createdBy, createdAt: created.createdAt },
  })
}
