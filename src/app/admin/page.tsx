'use client'
import { TrendingUp, ShoppingBag, Clock, Users, Package, CheckCircle, XCircle, DollarSign } from 'lucide-react'
import Link from 'next/link'

const STATS = [
  { label: "Today's Sales", value: '£428.50', change: '+12%', icon: TrendingUp, color: 'text-green-600 bg-green-100' },
  { label: "Today's Orders", value: '34', change: '+5 vs yesterday', icon: ShoppingBag, color: 'text-blue-600 bg-blue-100' },
  { label: 'Pending Orders', value: '7', change: 'Needs action', icon: Clock, color: 'text-orange-600 bg-orange-100' },
  { label: 'Total Customers', value: '1,240', change: '+18 this week', icon: Users, color: 'text-purple-600 bg-purple-100' },
]

const RECENT_ORDERS = [
  { id: 'PG100045', customer: 'Sarah Jones', items: 'Pepperoni Feast (12") + Fries', total: 14.48, status: 'New', time: '2 min ago' },
  { id: 'PG100044', customer: 'Mike Peters', items: 'BBQ Smash Burger + Coke', total: 10.48, status: 'Preparing', time: '8 min ago' },
  { id: 'PG100043', customer: 'Emma Davis', items: 'Meat Feast (15") + Wings', total: 20.98, status: 'Out for Delivery', time: '22 min ago' },
  { id: 'PG100042', customer: 'James Wilson', items: 'Any 2 x 12" Pizza Deal', total: 19.99, status: 'Delivered', time: '45 min ago' },
  { id: 'PG100041', customer: 'Lisa Brown', items: 'Chicken Tikka + Salad + Coke', total: 16.47, status: 'Delivered', time: '1 hr ago' },
]

const STATUS_COLOURS: Record<string, string> = {
  New: 'bg-blue-100 text-blue-700',
  Accepted: 'bg-yellow-100 text-yellow-700',
  Preparing: 'bg-orange-100 text-orange-700',
  'Out for Delivery': 'bg-purple-100 text-purple-700',
  Delivered: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-700',
}

const POPULAR = [
  { name: 'Pepperoni Feast (12")', orders: 142, revenue: 1419.58 },
  { name: 'Meat Feast (15")', orders: 98, revenue: 1077.02 },
  { name: 'BBQ Smash Burger', orders: 87, revenue: 782.13 },
  { name: 'American Hot (12")', orders: 75, revenue: 749.25 },
  { name: 'Chicken Fillet Burger', orders: 68, revenue: 475.32 },
]

export default function AdminDashboardPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm">Thursday, 19 June 2025</p>
        </div>
        <Link href="/admin/orders" className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors">
          View All Orders
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {STATS.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{stat.label}</span>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon size={16} />
              </div>
            </div>
            <div className="text-2xl font-black text-gray-900 mb-1">{stat.value}</div>
            <div className="text-xs text-gray-500">{stat.change}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Recent orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Recent Orders</h2>
            <Link href="/admin/orders" className="text-red-600 text-xs font-semibold hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {RECENT_ORDERS.map((order) => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-gray-900 text-sm">#{order.id}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOURS[order.status]}`}>{order.status}</span>
                  </div>
                  <div className="text-xs text-gray-500 truncate">{order.customer} · {order.items}</div>
                </div>
                <div className="shrink-0 text-right ml-3">
                  <div className="font-bold text-gray-900 text-sm">£{order.total.toFixed(2)}</div>
                  <div className="text-xs text-gray-400">{order.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Popular products */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-gray-900 mb-4">Top Products</h2>
          <div className="space-y-3">
            {POPULAR.map((p, i) => (
              <div key={p.name} className="flex items-start gap-3">
                <div className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold text-gray-500">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{p.name}</div>
                  <div className="text-xs text-gray-500">{p.orders} orders · £{p.revenue.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
