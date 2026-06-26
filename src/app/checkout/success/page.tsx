'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Loader2 } from 'lucide-react'
import { useCartStore } from '@/lib/cart-store'

function SuccessContent() {
  const searchParams  = useSearchParams()
  const sessionId     = searchParams.get('session_id')
  const { clearCart } = useCartStore()
  const [orderNumber, setOrderNumber] = useState<string | null>(null)
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    clearCart()
    if (!sessionId) { setLoading(false); return }
    fetch(`/api/checkout/session-status?session_id=${sessionId}`)
      .then((r) => r.json())
      .then((d) => { setOrderNumber(d.orderNumber ?? null) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [sessionId, clearCart])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-red-600" size={40} />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <CheckCircle className="mx-auto mb-4 text-green-500" size={64} />
        <h1 className="text-3xl font-black text-gray-900 mb-2">Order Confirmed!</h1>
        {orderNumber && (
          <p className="text-gray-500 mb-2">Order <span className="font-bold text-gray-900">#{orderNumber}</span></p>
        )}
        <p className="text-gray-500 mb-8">
          Payment received. We&apos;re preparing your order now. You&apos;ll receive a confirmation shortly.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/order-tracking" className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors">
            Track My Order
          </Link>
          <Link href="/menu" className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors">
            Back to Menu
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  )
}
