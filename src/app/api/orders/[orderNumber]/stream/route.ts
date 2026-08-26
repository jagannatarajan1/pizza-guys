import { NextRequest } from 'next/server'
import { orderEvents, type NewOrderEvent, type StatusChangedEvent, type OrderMessageEvent } from '@/lib/order-events'
import { createEventStream } from '@/lib/sse'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params
  if (!orderNumber) return new Response('Missing order number', { status: 400 })

  return createEventStream((send) => {
    const onNewOrder = (payload: NewOrderEvent) => {
      if (payload.orderNumber === orderNumber) send({ type: 'new-order' })
    }
    const onStatusChanged = (payload: StatusChangedEvent) => {
      if (payload.orderNumber === orderNumber) send({ type: 'status-changed', status: payload.status })
    }
    const onOrderMessage = (payload: OrderMessageEvent) => {
      if (payload.orderNumber === orderNumber) send({ type: 'order-message' })
    }
    orderEvents.on('new-order', onNewOrder)
    orderEvents.on('status-changed', onStatusChanged)
    orderEvents.on('order-message', onOrderMessage)
    return () => {
      orderEvents.off('new-order', onNewOrder)
      orderEvents.off('status-changed', onStatusChanged)
      orderEvents.off('order-message', onOrderMessage)
    }
  })
}
