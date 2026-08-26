import { NextRequest } from 'next/server'
import { requireViewer } from '@/lib/api-guard'
import { orderEvents, type NewOrderEvent, type StatusChangedEvent, type OrderMessageEvent } from '@/lib/order-events'
import { createEventStream } from '@/lib/sse'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const guard = await requireViewer(req)
  if (!guard.ok) return guard.res

  return createEventStream((send) => {
    const onNewOrder = (payload: NewOrderEvent) => send({ type: 'new-order', ...payload })
    const onStatusChanged = (payload: StatusChangedEvent) => send({ type: 'status-changed', ...payload })
    // So a second admin session sees a just-sent message show up too.
    const onOrderMessage = (payload: OrderMessageEvent) => send({ type: 'order-message', ...payload })
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
