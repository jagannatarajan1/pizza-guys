import { NextRequest } from 'next/server'
import { requireViewer } from '@/lib/api-guard'
import { orderEvents, type NewOrderEvent, type StatusChangedEvent } from '@/lib/order-events'
import { createEventStream } from '@/lib/sse'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const guard = await requireViewer(req)
  if (!guard.ok) return guard.res

  return createEventStream((send) => {
    const onNewOrder = (payload: NewOrderEvent) => send({ type: 'new-order', ...payload })
    const onStatusChanged = (payload: StatusChangedEvent) => send({ type: 'status-changed', ...payload })
    orderEvents.on('new-order', onNewOrder)
    orderEvents.on('status-changed', onStatusChanged)
    return () => {
      orderEvents.off('new-order', onNewOrder)
      orderEvents.off('status-changed', onStatusChanged)
    }
  })
}
