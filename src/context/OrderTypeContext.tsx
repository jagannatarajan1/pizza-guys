'use client'
import { createContext, useContext, useState, useEffect } from 'react'

export type OrderType = 'delivery' | 'collection' | null

type Ctx = {
  orderType: OrderType
  setOrderType: (t: OrderType) => void
}

const OrderTypeCtx = createContext<Ctx>({ orderType: null, setOrderType: () => {} })

export function OrderTypeProvider({ children }: { children: React.ReactNode }) {
  const [orderType, setOrderTypeState] = useState<OrderType>(null)

  useEffect(() => {
    const saved = localStorage.getItem('pg_order_type') as OrderType
    if (saved === 'delivery' || saved === 'collection') setOrderTypeState(saved)
  }, [])

  const setOrderType = (t: OrderType) => {
    setOrderTypeState(t)
    if (t) localStorage.setItem('pg_order_type', t)
    else localStorage.removeItem('pg_order_type')
  }

  return <OrderTypeCtx.Provider value={{ orderType, setOrderType }}>{children}</OrderTypeCtx.Provider>
}

export function useOrderType(): Ctx { return useContext(OrderTypeCtx) }
