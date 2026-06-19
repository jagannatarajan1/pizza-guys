'use client'
import { useState } from 'react'
import { Search, Filter, Printer, Check, X, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUSES = ['All', 'New', 'Accepted', 'Preparing', 'Ready', 'Out for Delivery', 'Completed', 'Cancelled']

const STATUS_COLOURS: Record<string, string> = {
  New: 'bg-blue-100 text-blue-700',
  Accepted: 'bg-yellow-100 text-yellow-700',
  Preparing: 'bg-orange-100 text-orange-700',
  Ready: 'bg-cyan-100 text-cyan-700',
  'Out for Delivery': 'bg-purple-100 text-purple-700',
  Completed: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-700',
}

type Order = {
  id: string
  customer: string
  phone: string
  address: string
  items: { name: string; qty: number; price: number }[]
  total: number
  status: string
  type: 'Delivery' | 'Collection'
  time: string
  payment: string
}

const MOCK_ORDERS: Order[] = [
  { id: 'PG100045', customer: 'Sarah Jones', phone: '07700901111', address: '12 High St, Staines, TW18 1AB', items: [{ name: 'Pepperoni Feast 12"', qty: 1, price: 12.99 }, { name: 'French Fries', qty: 1, price: 2.49 }], total: 14.48, status: 'New', type: 'Delivery', time: '14:32', payment: 'Card' },
  { id: 'PG100044', customer: 'Mike Peters', phone: '07700902222', address: '45 Church Rd, TW18 3EF', items: [{ name: 'BBQ Smash Burger', qty: 1, price: 8.99 }, { name: 'Coke', qty: 1, price: 1.49 }], total: 10.48, status: 'Preparing', type: 'Delivery', time: '14:28', payment: 'Google Pay' },
  { id: 'PG100043', customer: 'Emma Davis', phone: '07700903333', address: '8 Manor Ave, TW19 5GH', items: [{ name: 'Meat Feast 15"', qty: 1, price: 16.99 }, { name: 'BBQ Wings', qty: 1, price: 4.99 }], total: 20.98, status: 'Out for Delivery', type: 'Delivery', time: '14:05', payment: 'Card' },
  { id: 'PG100042', customer: 'James Wilson', phone: '07700904444', address: 'Collection', items: [{ name: 'Any 2x12" Pizza', qty: 1, price: 19.99 }], total: 19.99, status: 'Completed', type: 'Collection', time: '13:50', payment: 'Cash' },
  { id: 'PG100041', customer: 'Lisa Brown', phone: '07700905555', address: '22 Oak St, TW20 1JK', items: [{ name: 'Chicken Tikka 12"', qty: 1, price: 12.99 }, { name: 'Supreme Salad', qty: 1, price: 3.99 }], total: 16.98, status: 'New', type: 'Delivery', time: '13:40', payment: 'Apple Pay' },
]

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS)
  const [statusFilter, setStatusFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = orders.filter((o) => {
    const matchesStatus = statusFilter === 'All' || o.status === statusFilter
    const matchesSearch = search === '' || o.id.includes(search) || o.customer.toLowerCase().includes(search.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const updateStatus = (id: string, newStatus: string) => {
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: newStatus } : o))
    toast.success(`Order #${id} → ${newStatus}`)
  }

  const NEXT_STATUS: Record<string, string> = {
    New: 'Accepted', Accepted: 'Preparing', Preparing: 'Ready', Ready: 'Out for Delivery', 'Out for Delivery': 'Completed',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-gray-900">Orders</h1>
        <div className="text-sm text-gray-500">{filtered.length} orders</div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search orders..."
              className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-red-400"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {STATUSES.slice(0, 4).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${statusFilter === s ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders list */}
      <div className="space-y-3">
        {filtered.map((order) => (
          <div key={order.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div
              className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setExpanded(expanded === order.id ? null : order.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-black text-gray-900">#{order.id}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOURS[order.status]}`}>{order.status}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{order.type}</span>
                  <span className="text-xs text-gray-400">{order.time}</span>
                </div>
                <div className="text-sm text-gray-600 truncate">{order.customer} · {order.items.map((i) => `${i.qty}× ${i.name}`).join(', ')}</div>
              </div>
              <div className="shrink-0 text-right">
                <div className="font-black text-gray-900">£{order.total.toFixed(2)}</div>
                <div className="text-xs text-gray-400">{order.payment}</div>
              </div>
              <ChevronDown size={16} className={`text-gray-400 shrink-0 transition-transform ${expanded === order.id ? 'rotate-180' : ''}`} />
            </div>

            {expanded === order.id && (
              <div className="px-4 pb-4 border-t border-gray-50 pt-4">
                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Customer</div>
                    <div className="font-medium text-gray-900 text-sm">{order.customer}</div>
                    <div className="text-sm text-gray-600">{order.phone}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Address</div>
                    <div className="text-sm text-gray-600">{order.address}</div>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="text-xs text-gray-500 mb-2">Items</div>
                  {order.items.map((item) => (
                    <div key={item.name} className="flex justify-between text-sm py-1 border-b border-gray-50 last:border-0">
                      <span className="text-gray-700">{item.qty}× {item.name}</span>
                      <span className="font-medium">£{item.price.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold text-gray-900 mt-2 pt-2 border-t border-gray-100">
                    <span>Total</span>
                    <span>£{order.total.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {NEXT_STATUS[order.status] && (
                    <button
                      onClick={() => updateStatus(order.id, NEXT_STATUS[order.status])}
                      className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors"
                    >
                      <Check size={14} /> {NEXT_STATUS[order.status]}
                    </button>
                  )}
                  {order.status !== 'Cancelled' && order.status !== 'Completed' && (
                    <button
                      onClick={() => updateStatus(order.id, 'Cancelled')}
                      className="flex items-center gap-1.5 bg-red-100 text-red-700 hover:bg-red-200 text-xs font-bold px-3 py-2 rounded-xl transition-colors"
                    >
                      <X size={14} /> Reject
                    </button>
                  )}
                  <button className="flex items-center gap-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs font-bold px-3 py-2 rounded-xl transition-colors">
                    <Printer size={14} /> Print
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
