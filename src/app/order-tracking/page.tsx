'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Clock, Package, ChefHat, Bike, Home, Loader2, AlertCircle, Search } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

function OrderLookup() {
  const router = useRouter()
  const [input, setInput] = useState('')
  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <div className="text-5xl mb-4">🍕</div>
      <h1 className="text-2xl font-black text-gray-900 mb-2">Track Your Order</h1>
      <p className="text-gray-500 text-sm mb-6">Enter your order number to see the status</p>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && input && router.push(`/order-tracking?order=${input}`)}
          placeholder="e.g. PG123456"
          className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-red-400"
        />
        <button
          onClick={() => input && router.push(`/order-tracking?order=${input}`)}
          className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-3 rounded-xl transition-colors"
        >
          <Search size={18} />
        </button>
      </div>
      <Link href="/dashboard" className="mt-6 inline-block text-red-600 text-sm font-semibold hover:underline">
        View order history
      </Link>
    </div>
  )
}

const STAGES = [
  { id: 0, label: 'Order Received',    desc: 'We have received your order',          icon: Package  },
  { id: 1, label: 'Accepted',          desc: 'Restaurant has confirmed your order',   icon: CheckCircle },
  { id: 2, label: 'Preparing',         desc: 'Our chefs are making your food',        icon: ChefHat  },
  { id: 3, label: 'Out for Delivery',  desc: 'Your order is on the way',              icon: Bike     },
  { id: 4, label: 'Delivered',         desc: 'Enjoy your meal!',                      icon: Home     },
]

const COLLECTION_STAGES = [
  { id: 0, label: 'Order Received', desc: 'We have received your order',   icon: Package     },
  { id: 1, label: 'Accepted',       desc: 'Your order has been confirmed', icon: CheckCircle },
  { id: 2, label: 'Preparing',      desc: 'Our chefs are making your food', icon: ChefHat    },
  { id: 3, label: 'Ready',          desc: 'Your order is ready to collect', icon: Bike       },
  { id: 4, label: 'Collected',      desc: 'Enjoy your meal!',              icon: Home        },
]

type OrderData = {
  orderNumber: string
  status: string
  stage: number
  orderType: string
  customerName: string
  total: number
  createdAt: string
  items: { name: string; quantity: number; itemTotal: number }[]
}

const EST_MINUTES_BY_STAGE = [40, 30, 20, 10, 0]

function TrackingContent() {
  const searchParams   = useSearchParams()
  const orderNo        = searchParams.get('order') || ''
  const [order, setOrder]   = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(!!orderNo)
  const [error, setError]   = useState(false)

  useEffect(() => {
    if (!orderNo) return

    const fetchOrder = async () => {
      try {
        const res  = await fetch(`/api/orders/${orderNo}`)
        if (!res.ok) { setError(true); setLoading(false); return }
        const data = await res.json()
        setOrder(data)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
    const iv = setInterval(fetchOrder, 20_000)
    return () => clearInterval(iv)
  }, [orderNo])

  if (!orderNo) {
    return <OrderLookup />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-400">
        <Loader2 size={28} className="animate-spin mr-3" /> Loading order…
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <AlertCircle size={40} className="text-red-400 mx-auto mb-4" />
        <h1 className="text-xl font-black text-gray-900 mb-2">Order Not Found</h1>
        <p className="text-gray-500 text-sm mb-6">We couldn&apos;t find order #{orderNo}. Please check the number and try again, or contact us.</p>
        <Link href="/" className="bg-red-600 text-white font-bold px-6 py-3 rounded-xl text-sm hover:bg-red-700 transition-colors">
          Go Home
        </Link>
      </div>
    )
  }

  const isCollection     = order.orderType === 'collection'
  const stages           = isCollection ? COLLECTION_STAGES : STAGES
  const stage            = Math.max(0, order.stage)
  const isCancelled      = order.status === 'Cancelled'
  const isPendingPayment = order.status === 'pending_payment'
  const estMinutes       = EST_MINUTES_BY_STAGE[Math.min(stage, 4)]

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${isCancelled ? 'bg-red-100' : isPendingPayment ? 'bg-amber-100' : 'bg-green-100'}`}>
          {isCancelled ? <span className="text-3xl">❌</span> : isPendingPayment ? <span className="text-3xl">⏳</span> : <CheckCircle className="text-green-500" size={32} />}
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-1">
          {isCancelled ? 'Order Cancelled' : isPendingPayment ? 'Awaiting Payment' : stage === 4 ? 'Order Complete!' : 'Order Confirmed!'}
        </h1>
        <p className="text-gray-500 text-sm">Order #{order.orderNumber}</p>
        {isPendingPayment && (
          <p className="text-amber-600 text-sm mt-2">Your payment is being processed. This page will update automatically.</p>
        )}
        {!isCancelled && !isPendingPayment && stage < 4 && (
          <div className="inline-flex items-center gap-2 mt-3 bg-orange-50 text-orange-600 px-4 py-2 rounded-xl font-semibold text-sm">
            <Clock size={16} /> Est. {estMinutes} min remaining
          </div>
        )}
      </div>

      {/* Progress tracker */}
      {!isCancelled && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          {stages.map((s, i) => {
            const done   = stage > s.id
            const active = stage === s.id
            const Icon   = s.icon
            return (
              <div key={s.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    done ? 'bg-green-500 text-white' : active ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {done ? <CheckCircle size={20} /> : <Icon size={20} />}
                  </div>
                  {i < stages.length - 1 && (
                    <div className={`w-0.5 h-10 ${done ? 'bg-green-400' : 'bg-gray-200'} transition-colors`} />
                  )}
                </div>
                <div className="pt-2 pb-8">
                  <div className={`font-bold text-sm ${active ? 'text-red-600' : done ? 'text-gray-900' : 'text-gray-400'}`}>
                    {s.label}
                    {active && <span className="ml-2 inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                  </div>
                  <div className={`text-xs mt-0.5 ${active || done ? 'text-gray-500' : 'text-gray-300'}`}>{s.desc}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Order summary */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
        <h3 className="font-bold text-gray-900 mb-3">Order Summary</h3>
        <div className="space-y-1.5 text-sm mb-3">
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between text-gray-600">
              <span>{item.quantity}× {item.name}</span>
              <span>{formatPrice(item.itemTotal)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between font-black text-gray-900 border-t border-gray-100 pt-2">
          <span>Total</span><span>{formatPrice(order.total)}</span>
        </div>
      </div>

      {/* Contact */}
      <div className="bg-gray-900 text-white rounded-2xl p-5 mb-5">
        <h3 className="font-bold mb-3">Need Help?</h3>
        <div className="space-y-1 text-sm text-gray-400">
          <div className="flex justify-between"><span>Order</span><span className="text-white font-mono">#{order.orderNumber}</span></div>
          <div className="flex justify-between"><span>Restaurant</span><span className="text-white">Pizza Guys</span></div>
          <div className="flex justify-between"><span>Phone</span><span className="text-white">01784 452 888</span></div>
        </div>
      </div>

      <div className="flex gap-3">
        <Link href="/" className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl text-center transition-colors text-sm">
          Back to Home
        </Link>
        <Link href="/menu" className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl text-center transition-colors text-sm">
          Order Again
        </Link>
      </div>
    </div>
  )
}

export default function OrderTrackingPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-gray-500"><Loader2 size={24} className="animate-spin mr-2" /> Loading…</div>}>
      <TrackingContent />
    </Suspense>
  )
}
