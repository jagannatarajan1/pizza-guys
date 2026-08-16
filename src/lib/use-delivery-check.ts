'use client'
import { useState } from 'react'
import { isValidPostcode } from './utils'

export type DeliveryCheckResult = {
  available: boolean
  message?: string
  minOrder?: number
  deliveryFee?: number
  freeDeliveryApplied?: boolean
  retryable?: boolean
}

// The postcode check the homepage has always done, lifted out so the cart can
// run the identical check instead of a second copy of it. Same endpoint, same
// client-side format check, same handling of the three answers it can give
// (available / not available / temporarily unreachable).
export function useDeliveryCheck(subtotal: number) {
  const [postcode, setPostcodeState] = useState('')
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<DeliveryCheckResult | null>(null)

  // Editing the postcode drops the previous answer. Without this a customer
  // could check a postcode we deliver to, type a different one, and still be
  // holding a "yes" that no longer refers to what's in the box — which now
  // matters, because the cart's checkout button is gated on that answer.
  const setPostcode = (value: string) => {
    setPostcodeState(value)
    setResult(null)
  }

  const check = async () => {
    if (!postcode.trim()) return
    if (!isValidPostcode(postcode)) {
      setResult({ available: false, message: 'Enter a valid UK postcode (e.g. SW1A 1AA)' })
      return
    }
    setChecking(true)
    setResult(null)
    try {
      const res = await fetch('/api/delivery/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postcode, subtotal }),
      })
      setResult(await res.json())
    } catch {
      setResult({ available: false, retryable: true, message: 'Something went wrong — please try again' })
    } finally {
      setChecking(false)
    }
  }

  return { postcode, setPostcode, checking, result, check }
}
