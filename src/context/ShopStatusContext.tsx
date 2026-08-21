'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import type { ShopStatus } from '@/lib/shop-status'

const Ctx = createContext<ShopStatus | null>(null)

export function ShopStatusProvider({
  initial,
  children,
}: {
  // Computed server-side in the root layout from the same site-config read
  // it already does — every consumer gets a correct value in the very first
  // HTML response instead of null-until-fetch, and there's exactly one
  // /api/shop-status request per page load, however many components need it.
  initial: ShopStatus
  children: React.ReactNode
}) {
  const [status, setStatus] = useState<ShopStatus>(initial)

  useEffect(() => {
    // A tab can stay open across the shop opening or closing, so refresh once
    // after mount — `initial` only reflects the moment this page was
    // rendered.
    fetch('/api/shop-status')
      .then((r) => r.json())
      .then((d: ShopStatus) => setStatus(d))
      .catch(() => {})
  }, [])

  return <Ctx.Provider value={status}>{children}</Ctx.Provider>
}

export function useShopStatus(): ShopStatus {
  // Always provided by the root layout — every route is nested under it.
  return useContext(Ctx) as ShopStatus
}
