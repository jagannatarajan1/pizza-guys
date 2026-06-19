'use client'
import { useState } from 'react'
import { Download, TrendingUp, TrendingDown } from 'lucide-react'

const DAILY_DATA = [
  { date: '19 Jun', orders: 34, revenue: 428.50 },
  { date: '18 Jun', orders: 29, revenue: 371.20 },
  { date: '17 Jun', orders: 41, revenue: 512.80 },
  { date: '16 Jun', orders: 38, revenue: 487.60 },
  { date: '15 Jun', orders: 22, revenue: 278.90 },
  { date: '14 Jun', orders: 18, revenue: 231.40 },
  { date: '13 Jun', orders: 36, revenue: 455.20 },
]

const PAYMENT_BREAKDOWN = [
  { method: 'Card', amount: 2145.60, pct: 62 },
  { method: 'Google Pay', amount: 621.20, pct: 18 },
  { method: 'Apple Pay', amount: 414.80, pct: 12 },
  { method: 'Cash', amount: 276.20, pct: 8 },
]

export default function AdminReportsPage() {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily')

  const totalRevenue = DAILY_DATA.reduce((s, d) => s + d.revenue, 0)
  const totalOrders = DAILY_DATA.reduce((s, d) => s + d.orders, 0)
  const avgOrderValue = totalRevenue / totalOrders

  const maxRevenue = Math.max(...DAILY_DATA.map((d) => d.revenue))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-gray-900">Reports</h1>
        <button className="flex items-center gap-2 border border-gray-200 text-gray-700 font-bold px-4 py-2 rounded-xl text-sm hover:bg-gray-50 transition-colors">
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Period toggle */}
      <div className="flex gap-2 mb-5">
        {(['daily', 'weekly', 'monthly'] as const).map((p) => (
          <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-colors ${period === p ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {p}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Revenue', value: `£${totalRevenue.toFixed(2)}`, change: '+8.2%', up: true },
          { label: 'Total Orders', value: totalOrders.toString(), change: '+12.4%', up: true },
          { label: 'Avg Order Value', value: `£${avgOrderValue.toFixed(2)}`, change: '-1.3%', up: false },
          { label: 'New Customers', value: '18', change: '+5.1%', up: true },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="text-xs text-gray-500 mb-1">{stat.label}</div>
            <div className="text-2xl font-black text-gray-900 mb-1">{stat.value}</div>
            <div className={`flex items-center gap-1 text-xs font-medium ${stat.up ? 'text-green-600' : 'text-red-500'}`}>
              {stat.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {stat.change} vs last week
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-gray-900 mb-4">Daily Revenue (Last 7 Days)</h2>
          <div className="flex items-end gap-3 h-40">
            {DAILY_DATA.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-xs font-bold text-gray-700">£{d.revenue.toFixed(0)}</div>
                <div
                  className="w-full bg-red-500 rounded-t-lg transition-all hover:bg-red-600"
                  style={{ height: `${(d.revenue / maxRevenue) * 100}%`, minHeight: '4px' }}
                />
                <div className="text-xs text-gray-400 whitespace-nowrap">{d.date}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment methods */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-gray-900 mb-4">Payment Methods</h2>
          <div className="space-y-3">
            {PAYMENT_BREAKDOWN.map((p) => (
              <div key={p.method}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{p.method}</span>
                  <span className="font-bold text-gray-900">{p.pct}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: `${p.pct}%` }} />
                </div>
                <div className="text-xs text-gray-400 mt-0.5">£{p.amount.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Orders table */}
      <div className="bg-white rounded-2xl border border-gray-100 mt-5 overflow-hidden">
        <div className="p-4 border-b border-gray-50">
          <h2 className="font-bold text-gray-900">Daily Breakdown</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Orders</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Revenue</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Avg Order</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {DAILY_DATA.map((d) => (
              <tr key={d.date} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">{d.date}</td>
                <td className="px-4 py-3 text-gray-700">{d.orders}</td>
                <td className="px-4 py-3 font-bold text-gray-900">£{d.revenue.toFixed(2)}</td>
                <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">£{(d.revenue / d.orders).toFixed(2)}</td>
              </tr>
            ))}
            <tr className="bg-gray-50 font-bold">
              <td className="px-4 py-3 text-gray-900">Total</td>
              <td className="px-4 py-3 text-gray-900">{totalOrders}</td>
              <td className="px-4 py-3 text-gray-900">£{totalRevenue.toFixed(2)}</td>
              <td className="px-4 py-3 text-gray-900 hidden sm:table-cell">£{avgOrderValue.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
