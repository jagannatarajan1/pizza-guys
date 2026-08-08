// The automatic middle steps each order type passes through between staff
// accepting it and the final, always-manual "Completed". Single source of
// truth: the scanner, the admin buttons, and both countdowns all derive from
// this, so adding an order type or an extra step is a one-line change here.
export const AUTO_STEPS_BY_ORDER_TYPE: Record<string, string[]> = {
  delivery:   ['Preparing', 'Out for Delivery'],
  collection: ['Preparing', 'Ready'],
}

export type PrepTimingInput = {
  orderType: string
  acceptedAt: Date | string
  prepMinutes: number
}

export type StepTiming = { status: string; startsAt: Date; endsAt: Date }

export type PrepTiming = {
  steps: StepTiming[]
  completionAt: Date
  currentStepIndex: number
  currentAutoStatus: string
  remainingMs: number       // left in the current step
  totalRemainingMs: number  // left until completionAt
}

export function autoSteps(orderType: string): string[] {
  return AUTO_STEPS_BY_ORDER_TYPE[orderType] ?? AUTO_STEPS_BY_ORDER_TYPE.delivery
}

export function autoStepIndex(orderType: string, status: string): number {
  return autoSteps(orderType).indexOf(status)
}

// Splits the chosen prep time evenly across however many automatic steps the
// order type has, and reports where the clock says the order should be right
// now. Pure — the scanner and both UIs call this with the same inputs and
// always agree, without the UIs needing to ask the server what to display.
export function computePrepTiming(input: PrepTimingInput, now: Date = new Date()): PrepTiming {
  const steps = autoSteps(input.orderType)
  const acceptedMs = new Date(input.acceptedAt).getTime()
  const totalMs = input.prepMinutes * 60_000
  const perStepMs = totalMs / steps.length

  const stepTimings: StepTiming[] = steps.map((status, i) => ({
    status,
    startsAt: new Date(acceptedMs + perStepMs * i),
    endsAt:   new Date(acceptedMs + perStepMs * (i + 1)),
  }))

  const elapsedMs = now.getTime() - acceptedMs
  // Clamped to the last step: running over time never implies "Completed",
  // which only ever happens when a human presses the button.
  const currentStepIndex = Math.min(
    Math.max(0, Math.floor(elapsedMs / perStepMs)),
    steps.length - 1
  )
  const currentStep = stepTimings[currentStepIndex]

  return {
    steps: stepTimings,
    completionAt: new Date(acceptedMs + totalMs),
    currentStepIndex,
    currentAutoStatus: currentStep.status,
    remainingMs: Math.max(0, currentStep.endsAt.getTime() - now.getTime()),
    totalRemainingMs: Math.max(0, acceptedMs + totalMs - now.getTime()),
  }
}

// The manual next status for a given point in the pipeline. Replaces the old
// order-type-blind NEXT_STATUS map, which wrongly offered "Out for Delivery"
// as the next step for collection orders. Used for the always-manual final
// step and as the fallback for orders placed before prep timing existed.
export function legacyNextStatus(orderType: string, status: string): string | null {
  if (status === 'confirmed' || status === 'New') return 'Accepted'
  const steps = autoSteps(orderType)
  if (status === 'Accepted') return steps[0]
  const idx = steps.indexOf(status)
  if (idx === -1) return null
  return idx < steps.length - 1 ? steps[idx + 1] : 'Completed'
}

export function formatMMSS(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000))
  return `${Math.floor(total / 60)}:${(total % 60).toString().padStart(2, '0')}`
}
