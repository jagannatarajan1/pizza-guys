import prisma from './prisma'
import { emitStatusChanged } from './order-events'
import { AUTO_STEPS_BY_ORDER_TYPE, autoStepIndex, computePrepTiming } from './prep-timer'

// Cached on globalThis the same way order-events.ts is, so Next's dev-mode
// module reloading can't leave a second scanner running alongside the first.
declare global {
  var _prepTimerScannerStarted: boolean | undefined
}

const SCAN_INTERVAL_MS = 10_000

// Every status an order can sit at while still having automatic steps ahead
// of it. Derived from the step table rather than hardcoded so a new order
// type or extra step needs no change here.
function candidateStatuses(): string[] {
  const nonFinal = Object.values(AUTO_STEPS_BY_ORDER_TYPE).flatMap((steps) => steps.slice(0, -1))
  return [...new Set(['Accepted', ...nonFinal])]
}

async function scanOnce() {
  const orders = await prisma.order.findMany({
    where: {
      status: { in: candidateStatuses() },
      acceptedAt: { not: null },
      prepMinutes: { not: null },
    },
    select: { id: true, orderNumber: true, orderType: true, status: true, acceptedAt: true, prepMinutes: true },
  })

  for (const order of orders) {
    try {
      const timing = computePrepTiming({
        orderType: order.orderType,
        acceptedAt: order.acceptedAt!,
        prepMinutes: order.prepMinutes!,
      })

      // Only ever move forward. This is what makes a manual "mark done now"
      // safe: once staff jump ahead, the stored index outruns the computed
      // one and the scanner leaves that order alone.
      if (timing.currentStepIndex <= autoStepIndex(order.orderType, order.status)) continue

      // Compare-and-swap on the status we just read, so a Cancel (or any
      // other staff action) landing between the read and this write wins
      // instead of being silently overwritten.
      const result = await prisma.order.updateMany({
        where: { id: order.id, status: order.status },
        data:  { status: timing.currentAutoStatus },
      })
      if (result.count === 1) {
        emitStatusChanged({ orderNumber: order.orderNumber, status: timing.currentAutoStatus })
      }
    } catch (err) {
      console.error(`[prep-timer] could not advance order ${order.orderNumber}:`, err)
    }
  }
}

// Self-rescheduling rather than setInterval: a slow tick (busy DB, network
// blip) delays the next one instead of stacking a second scan on top of it.
async function tick() {
  try {
    await scanOnce()
  } catch (err) {
    console.error('[prep-timer] scan failed:', err)
  }
  setTimeout(tick, SCAN_INTERVAL_MS)
}

export function startPrepTimerScanner() {
  if (globalThis._prepTimerScannerStarted) return
  globalThis._prepTimerScannerStarted = true
  // Run immediately so a restart catches up any orders that came due while
  // the process was down, rather than waiting a full interval first.
  tick()
}
