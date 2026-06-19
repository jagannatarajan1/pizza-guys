'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Clock, Package, ChefHat, Bike, Home } from 'lucide-react'

const STAGES = [
  { id: 0, label: 'Order Received', desc: 'We have received your order', icon: Package },
  { id: 1, label: 'Accepted', desc: 'Restaurant has confirmed your order', icon: CheckCircle },
  { id: 2, label: 'Preparing', desc: 'Our chefs are making your food', icon: ChefHat },
  { id: 3, label: 'Out for Delivery', desc: 'Your order is on the way', icon: Bike },
  { id: 4, label: 'Delivered', desc: 'Enjoy your meal!', icon: Home },
]

function TrackingContent() {
  const searchParams = useSearchParams()
  const orderNo = searchParams.get('order') || 'PG123456'
  const [stage, setStage] = useState(0)

  // Simulate progress for demo
  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 3000),
      setTimeout(() => setStage(2), 7000),
      setTimeout(() => setStage(3), 12000),
      setTimeout(() => setStage(4), 18000),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  const estMinutes = Math.max(5, 40 - stage * 8)

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl mb-4">
          <CheckCircle className="text-green-500" size={32} />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-1">Order Confirmed!</h1>
        <p className="text-gray-500 text-sm">Order #{orderNo}</p>
        {stage < 4 && (
          <div className="inline-flex items-center gap-2 mt-3 bg-orange-50 text-orange-600 px-4 py-2 rounded-xl font-semibold text-sm">
            <Clock size={16} /> Est. {estMinutes} min remaining
          </div>
        )}
      </div>

      {/* Progress tracker */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="space-y-0">
          {STAGES.map((s, i) => {
            const done = stage > s.id
            const active = stage === s.id
            const Icon = s.icon
            return (
              <div key={s.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      done ? 'bg-green-500 text-white' : active ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {done ? <CheckCircle size={20} /> : <Icon size={20} />}
                  </div>
                  {i < STAGES.length - 1 && (
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
      </div>

      {/* Delivery info */}
      <div className="bg-gray-900 text-white rounded-2xl p-5 mb-5">
        <h3 className="font-bold mb-3">Delivery Information</h3>
        <div className="space-y-1 text-sm text-gray-400">
          <div className="flex justify-between"><span>Order number</span><span className="text-white font-mono">#{orderNo}</span></div>
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
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-gray-500">Loading...</div>}>
      <TrackingContent />
    </Suspense>
  )
}
