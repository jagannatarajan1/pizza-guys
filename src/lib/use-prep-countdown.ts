'use client'
import { useEffect, useState } from 'react'
import { computePrepTiming, type PrepTiming, type PrepTimingInput } from './prep-timer'

// Ticks once a second off the wall clock, independent of the ~10s server
// scan, so the displayed mm:ss stays exact even between status pushes.
// Pass null (e.g. an order with no prep time set) to disable the timer.
export function usePrepCountdown(input: PrepTimingInput | null): PrepTiming | null {
  const [now, setNow] = useState(() => Date.now())

  const orderType   = input?.orderType
  const acceptedAt  = input?.acceptedAt
  const prepMinutes = input?.prepMinutes

  useEffect(() => {
    if (!orderType || !acceptedAt || !prepMinutes) return
    const iv = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(iv)
    // Keyed on the values rather than the object so a caller passing a fresh
    // literal each render doesn't restart the interval every second.
  }, [orderType, acceptedAt, prepMinutes])

  if (!input) return null
  return computePrepTiming(input, new Date(now))
}
