'use client'
import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, ShoppingBag, Clock, Users, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'

const STATUS_COLOURS: Record<string, string> = {
  New:                'bg-blue-100 text-blue-700',
  Accepted:           'bg-yellow-100 text-yellow-700',
  Preparing:          'bg-orange-100 text-orange-700',
  Ready:              'bg-cyan-100 text-cyan-700',
  'Out for Delivery': 'bg-purple-100 text-purple-700',
  Completed:          'bg-green-100 text-green-700',
  Cancelled:          'bg-red-100 text-red-700',
}

type StatsData = {
  today: {
    revenue: number
    orders: number
    revChangePct: number
    ordersVsYesterday: number
  }
  pendingCount: number
  customerCount: number
  weekRevenue: number
  recentOrders: {
    id: string
    orderNumber: string
    customerName: string
    status: string
    total: number
    orderType: string
    paymentMethod: string
    createdAt: string
    itemsSummary: string
  }[]
}

export default function AdminDashboardPage() {
  const [stats, setStats]   = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        <Loader2 size={28} className="animate-spin mr-3" /> Loading dashboard…
      </div>
    )
  }

  const s = stats
  const revChangePositive = (s?.today.revChangePct ?? 0) >= 0

  const STAT_CARDS = [
    {
      label: "Today's Revenue",
      value: s ? formatPrice(s.today.revenue) : '—',
      change: s ? `${revChangePositive ? '+' : ''}${s.today.revChangePct}% vs yesterday` : '',
      icon: TrendingUp,
      color: 'text-green-600 bg-green-100',
      positive: revChangePositive,
    },
    {
      label: "Today's Orders",
      value: s ? String(s.today.orders) : '—',
      change: s ? `${s.today.ordersVsYesterday >= 0 ? '+' : ''}${s.today.ordersVsYesterday} vs yesterday` : '',
      icon: ShoppingBag,
      color: 'text-blue-600 bg-blue-100',
      positive: (s?.today.ordersVsYesterday ?? 0) >= 0,
    },
    {
      label: 'Active Orders',
      value: s ? String(s.pendingCount) : '—',
      change: s && s.pendingCount > 0 ? 'Needs attention' : 'All clear',
      icon: Clock,
      color: 'text-orange-600 bg-orange-100',
      positive: (s?.pendingCount ?? 0) === 0,
    },
    {
      label: 'Total Customers',
      value: s ? s.customerCount.toLocaleString() : '—',
      change: 'Registered accounts',
      icon: Users,
      color: 'text-purple-600 bg-purple-100',
      positive: true,
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm">{today}</p>
        </div>
        <Link
          href="/admin/orders"
          className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors"
        >
          View All Orders
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {STAT_CARDS.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{card.label}</span>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.color}`}>
                <card.icon size={16} />
              </div>
            </div>
            <div className="text-2xl font-black text-gray-900 mb-1">{card.value}</div>
            <div className={`text-xs flex items-center gap-1 ${card.positive ? 'text-green-600' : 'text-red-500'}`}>
              {card.positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {card.change}
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Recent orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Recent Orders</h2>
            <Link href="/admin/orders" className="text-red-600 text-xs font-semibold hover:underline">
              View all
            </Link>
          </div>
          {!s || s.recentOrders.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No orders yet</p>
          ) : (
            <div className="space-y-3">
              {s.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="font-bold text-gray-900 text-sm">#{order.orderNumber}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOURS[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{order.customerName} · {order.itemsSummary}</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <div className="font-bold text-gray-900 text-sm">{formatPrice(order.total)}</div>
                    <div className="text-xs text-gray-400 capitalize">{order.paymentMethod}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 mb-3">This Week</h3>
            <div className="text-3xl font-black text-gray-900 mb-1">
              {s ? formatPrice(s.weekRevenue) : '—'}
            </div>
            <p className="text-sm text-gray-500">Total revenue (last 7 days)</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 mb-3">Quick Links</h3>
            <div className="space-y-2">
              {[
                { href: '/admin/orders?status=New', label: '🔔 New orders' },
                { href: '/admin/products', label: '🍕 Manage products' },
                { href: '/admin/settings', label: '⚙️ Site settings' },
                { href: '/admin/hours', label: '🕐 Opening hours' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
