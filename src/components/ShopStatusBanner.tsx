'use client'
import { useEffect, useState } from 'react'
import { Clock, X } from 'lucide-react'
import type { ShopStatus } from '@/lib/shop-status'

export default function ShopStatusBanner() {
  const [status, setStatus]       = useState<ShopStatus | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    fetch('/api/shop-status')
      .then((r) => r.json())
      .then((d: ShopStatus) => setStatus(d))
      .catch(() => {})
  }, [])

  if (!status || status.isOpen || dismissed) return null

  return (
    <div className="relative z-50 border-b border-amber-300/30 py-2.5 px-4 text-center text-sm font-bold flex items-center justify-center gap-2" style={{ background: '#1a0a00', color: '#FFD700' }}>
      <Clock size={14} className="shrink-0" style={{ color: '#FFD700' }} />
      <span>
        <span className="text-amber-400">Ordering Currently Closed</span>
        <span className="text-amber-300/70 font-medium"> · {status.message}</span>
      </span>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-400/60 hover:text-amber-400 transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  )
}
