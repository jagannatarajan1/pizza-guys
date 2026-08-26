import { EventEmitter } from 'events'

// In-memory pub/sub so the admin orders page and a customer's order-tracking
// page can be pushed live updates (via Server-Sent Events) the instant an
// order is paid or its status changes, instead of waiting on a polling
// timer. Cached on globalThis the same way src/lib/prisma.ts is, so Next's
// dev-mode module reloading doesn't spawn a second bus that nobody's
// listening on. This only works within a single running server process —
// fine for this app's single PM2 process, but wouldn't fan out across
// multiple instances if the app were ever scaled horizontally.
declare global {
  var _orderEvents: EventEmitter | undefined
}

export const orderEvents = globalThis._orderEvents ?? new EventEmitter()
if (!globalThis._orderEvents) globalThis._orderEvents = orderEvents
orderEvents.setMaxListeners(200)

export type NewOrderEvent = { orderNumber: string }
export type StatusChangedEvent = { orderNumber: string; status: string }
export type OrderMessageEvent = { orderNumber: string }

export function emitNewOrder(payload: NewOrderEvent) {
  orderEvents.emit('new-order', payload)
}

export function emitStatusChanged(payload: StatusChangedEvent) {
  orderEvents.emit('status-changed', payload)
}

// The customer's tracking page treats every SSE message the same way — an
// unconditional "something changed, refetch the order" — so this only needs
// to carry the order number the message belongs to.
export function emitOrderMessage(payload: OrderMessageEvent) {
  orderEvents.emit('order-message', payload)
}
