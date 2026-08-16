'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Package, ChefHat, Bike, Home, Loader2, AlertCircle, Search } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'
import { useSiteConfig } from '@/context/SiteConfigContext'
import { useCartStore } from '@/lib/cart-store'
import { reorderItems } from '@/lib/reorder'

const STATUS_PILL: Record<string, string> = {
  pending_payment:    'bg-amber-100 text-amber-700',
  confirmed:          'bg-blue-100 text-blue-700',
  New:                'bg-blue-100 text-blue-700',
  Accepted:           'bg-yellow-100 text-yellow-700',
  Preparing:          'bg-orange-100 text-orange-700',
  Ready:              'bg-cyan-100 text-cyan-700',
  'Out for Delivery': 'bg-purple-100 text-purple-700',
  Completed:          'bg-green-100 text-green-700',
  Cancelled:          'bg-red-100 text-red-700',
}

type HistoryOrder = {
  id: string
  orderNumber: string
  status: string
  orderType: string
  total: number
  createdAt: string
  items: { name: string; quantity: number; image: string }[]
}

function OrderHistory() {
  const router = useRouter()
  const [orders, setOrders]   = useState<HistoryOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/orders')
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center py-10 text-gray-400">
      <Loader2 size={20} className="animate-spin mr-2" /> Loading your orders…
    </div>
  )

  if (orders.length === 0) return (
    <p className="text-center text-gray-400 text-sm py-8">No orders yet — place your first order!</p>
  )

  return (
    <div className="space-y-3 mt-6">
      <h2 className="font-bold text-gray-900 text-sm">Your Recent Orders</h2>
      {orders.map((o) => (
        <button
          key={o.id}
          onClick={() => router.push(`/order-tracking?order=${o.orderNumber}`)}
          className="w-full text-left bg-white border border-gray-100 rounded-2xl p-4 hover:border-red-200 hover:bg-red-50 transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-xs font-bold text-gray-500">#{o.orderNumber}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_PILL[o.status] ?? 'bg-gray-100 text-gray-600'}`}>
              {o.status}
            </span>
          </div>
          {/* Product images */}
          <div className="flex gap-1.5 mb-2">
            {o.items.slice(0, 4).map((item, idx) => (
              <div key={idx} className="relative shrink-0">
                {item.image
                  ? <img src={item.image} alt={item.name} className="w-11 h-11 rounded-lg object-cover border border-gray-100" />
                  : <div className="w-11 h-11 rounded-lg bg-gray-100 flex items-center justify-center text-base">🍕</div>
                }
                {item.quantity > 1 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {item.quantity}
                  </span>
                )}
              </div>
            ))}
            {o.items.length > 4 && (
              <div className="w-11 h-11 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                +{o.items.length - 4}
              </div>
            )}
          </div>
          <div className="font-semibold text-gray-900 text-xs truncate">
            {o.items.slice(0, 2).map((i) => `${i.quantity}× ${i.name}`).join(', ')}
            {o.items.length > 2 && ` +${o.items.length - 2} more`}
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-400">
              {new Date(o.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              {' · '}{o.orderType === 'delivery' ? 'Delivery' : 'Collection'}
            </span>
            <span className="font-bold text-gray-900 text-sm">{formatPrice(o.total)}</span>
          </div>
        </button>
      ))}
    </div>
  )
}

function OrderLookup() {
  const router = useRouter()
  const { user } = useAuth()
  const [input, setInput] = useState('')

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <div className="text-center mb-6">
        <div className="text-5xl mb-4">🍕</div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">Track Your Order</h1>
        <p className="text-gray-500 text-sm">Enter your order number to see the status</p>
      </div>
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

      {user ? (
        <OrderHistory />
      ) : (
        <p className="mt-6 text-center text-sm text-gray-500">
          <Link href="/login?redirect=/order-tracking" className="text-red-600 font-semibold hover:underline">Sign in</Link>
          {' '}to see your order history
        </p>
      )}
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
  acceptedAt: string | null
  prepMinutes: number | null
  createdAt: string
  items: {
    productId: string; name: string; quantity: number; itemTotal: number; image: string
    modifiers: { groupId: string; groupName: string; options: { id: string; name: string; price: number }[] }[]
    specialInstructions: string
  }[]
}

function TrackingContent() {
  const searchParams   = useSearchParams()
  const router         = useRouter()
  const { biz_name, biz_phone } = useSiteConfig()
  const addItem        = useCartStore((s) => s.addItem)
  const orderNo        = searchParams.get('order') || ''
  const [order, setOrder]   = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(!!orderNo)
  const [error, setError]   = useState(false)

  const handleReorder = () => {
    if (!order) return
    reorderItems(order.items, { addItem, goToCart: () => router.push('/cart') })
  }

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
    // Safety-net poll in case the live connection below ever drops.
    const iv = setInterval(fetchOrder, 20_000)

    // Live push: the moment the kitchen/admin moves this order to the next
    // stage (or payment finishes confirming), re-fetch immediately instead
    // of waiting up to 20s for the next poll.
    const es = new EventSource(`/api/orders/${orderNo}/stream`)
    es.onmessage = () => fetchOrder()

    return () => {
      clearInterval(iv)
      es.close()
    }
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
        {/* No ETA, countdown, or "ready by" time is shown to the customer.
            The kitchen still runs on the preparation timer — staff see it on
            the admin orders screen — but the customer sees only the status. */}
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
        <div className="space-y-2.5 mb-3">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              {item.image
                ? <img src={item.image} alt={item.name} className="w-12 h-12 rounded-xl object-cover border border-gray-100 shrink-0" />
                : <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-xl shrink-0">🍕</div>
              }
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 text-sm truncate">{item.name}</div>
                <div className="text-xs text-gray-400">Qty: {item.quantity}</div>
              </div>
              <span className="text-sm font-bold text-gray-900 shrink-0">{formatPrice(item.itemTotal)}</span>
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
          <div className="flex justify-between"><span>Restaurant</span><span className="text-white">{biz_name}</span></div>
          <div className="flex justify-between"><span>Phone</span><span className="text-white">{biz_phone}</span></div>
        </div>
      </div>

      <div className="flex gap-3">
        <Link href="/order-tracking" className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl text-center transition-colors text-sm">
          Order History
        </Link>
        <button onClick={handleReorder} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl text-center transition-colors text-sm">
          Order Again
        </button>
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
