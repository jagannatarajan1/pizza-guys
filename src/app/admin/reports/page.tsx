'use client'
import { useState, useEffect, useMemo } from 'react'
import { Download, TrendingUp, Loader2 } from 'lucide-react'
import {
  ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip,
  Area, Bar, Legend,
} from 'recharts'
import { formatPrice } from '@/lib/utils'

type ReportData = {
  data: { date: string; orders: number; revenue: number }[]
  paymentBreakdown: { method: string; amount: number; pct: number }[]
  topProducts: { name: string; orders: number; revenue: number }[]
  totals: { revenue: number; orders: number; avgOrder: number }
}

type Period = 'daily' | 'weekly' | 'monthly' | 'custom'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function daysAgoISO(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; dataKey: string }[]; label?: string }) {
  if (!active || !payload || payload.length === 0) return null
  const revenue = payload.find((p) => p.dataKey === 'revenue')?.value ?? 0
  const orders  = payload.find((p) => p.dataKey === 'orders')?.value ?? 0
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2 text-xs">
      <div className="font-black text-gray-900 mb-1">{label}</div>
      <div className="text-red-600 font-semibold">{formatPrice(revenue)} revenue</div>
      <div className="text-gray-500">{orders} order{orders !== 1 ? 's' : ''}</div>
    </div>
  )
}

export default function AdminReportsPage() {
  const [period, setPeriod]   = useState<Period>('daily')
  const [from, setFrom]       = useState(daysAgoISO(6))
  const [to, setTo]           = useState(todayISO())
  const [data, setData]       = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ period })
    if (period === 'custom') { params.set('from', from); params.set('to', to) }
    fetch(`/api/admin/reports?${params.toString()}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [period, from, to])

  const chartData = useMemo(() => data?.data ?? [], [data])

  const exportCSV = () => {
    if (!data) return
    const rows = [
      ['Date', 'Orders', 'Revenue'],
      ...data.data.map((d) => [d.date, d.orders, d.revenue.toFixed(2)]),
    ]
    const csv  = rows.map((r) => r.join(',')).join('\n')
    const link = document.createElement('a')
    link.href  = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`
    link.download = `pizza-guys-report-${period}.csv`
    link.click()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-gray-900">Reports</h1>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 border border-gray-200 text-gray-700 font-bold px-4 py-2 rounded-xl text-sm hover:bg-gray-50 transition-colors"
        >
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Period toggle + custom date range */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {(['daily', 'weekly', 'monthly', 'custom'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              period === p ? 'bg-red-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {p === 'daily' ? 'Daily (7 days)' : p === 'weekly' ? 'Weekly (4 weeks)' : p === 'monthly' ? 'Monthly (12 months)' : 'Custom range'}
          </button>
        ))}

        {period === 'custom' && (
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-1.5">
            <input
              type="date"
              value={from}
              max={to}
              onChange={(e) => setFrom(e.target.value)}
              className="text-sm font-semibold text-gray-700 focus:outline-none"
            />
            <span className="text-gray-300">→</span>
            <input
              type="date"
              value={to}
              min={from}
              max={todayISO()}
              onChange={(e) => setTo(e.target.value)}
              className="text-sm font-semibold text-gray-700 focus:outline-none"
            />
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 size={24} className="animate-spin mr-2" /> Loading report…
        </div>
      ) : !data || data.data.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No order data for this period</div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Total Revenue', value: formatPrice(data.totals.revenue) },
              { label: 'Total Orders',  value: String(data.totals.orders) },
              { label: 'Avg Order',     value: formatPrice(data.totals.avgOrder) },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="text-xs text-gray-500 mb-1">{s.label}</div>
                <div className="text-2xl font-black text-gray-900">{s.value}</div>
              </div>
            ))}
          </div>

          {/* Revenue + orders chart */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-red-600" /> Revenue &amp; Orders
            </h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#dc2626" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#dc2626" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={{ stroke: '#f3f4f6' }} tickLine={false} />
                  <YAxis yAxisId="revenue" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={48} tickFormatter={(v) => `£${v}`} />
                  <YAxis yAxisId="orders" orientation="right" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar yAxisId="orders" dataKey="orders" name="Orders" fill="#fde68a" radius={[4, 4, 0, 0]} barSize={18} />
                  <Area yAxisId="revenue" type="monotone" dataKey="revenue" name="Revenue" stroke="#dc2626" strokeWidth={2} fill="url(#revenueFill)" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            {/* Payment breakdown */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-bold text-gray-900 mb-4">Payment Methods</h2>
              <div className="space-y-3">
                {data.paymentBreakdown.map((p) => (
                  <div key={p.method}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize text-gray-700 font-medium">{p.method}</span>
                      <span className="text-gray-500">{formatPrice(p.amount)} ({p.pct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500 rounded-full transition-all"
                        style={{ width: `${p.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
                {data.paymentBreakdown.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">No data</p>
                )}
              </div>
            </div>

            {/* Top products */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-bold text-gray-900 mb-4">Top Products</h2>
              <div className="space-y-2">
                {data.topProducts.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-3 py-1.5">
                    <span className="text-xs font-black text-gray-400 w-5">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">{p.name}</div>
                      <div className="text-xs text-gray-400">{p.orders} sold</div>
                    </div>
                    <span className="text-sm font-bold text-gray-700 shrink-0">{formatPrice(p.revenue)}</span>
                  </div>
                ))}
                {data.topProducts.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">No data</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
