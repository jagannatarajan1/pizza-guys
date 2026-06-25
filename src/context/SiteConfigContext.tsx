'use client'
import { createContext, useContext } from 'react'
import type { SiteConfig } from '@/lib/site-config'
import { DEFAULTS } from '@/lib/site-config'

const Ctx = createContext<SiteConfig>(DEFAULTS)

export function SiteConfigProvider({
  initial,
  children,
}: {
  initial: SiteConfig
  children: React.ReactNode
}) {
  return <Ctx.Provider value={initial}>{children}</Ctx.Provider>
}

export function useSiteConfig(): SiteConfig {
  return useContext(Ctx)
}
