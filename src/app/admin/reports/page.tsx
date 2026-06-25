'use client'
import { useState, useEffect } from 'react'
import { Download, TrendingUp, Loader2 } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

type ReportData = {
  data: { date: string; orders: number; revenue: number }[]
  paymentBreakdown: { method: string; amount: number; pct: number }[]
  topProducts: { name: string; orders: number; revenue: number }[]
  totals: { revenue: number; orders: number; avgOrder: number }
}

export default function AdminReportsPage() {
  const [period, setPeriod]   = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [data, setData]       = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/reports?period=${period}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [period])

  const maxRevenue = data ? Math.max(...data.data.map((d) => d.revenue), 1) : 1

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

      {/* Period toggle */}
      <div className="flex gap-2 mb-6">
        {(['daily', 'weekly', 'monthly'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              period === p ? 'bg-red-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {p === 'daily' ? 'Daily (7 days)' : p === 'weekly' ? 'Weekly (4 weeks)' : 'Monthly (12 months)'}
          </button>
        ))}
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
              { label: 'Total Revenue', value: formatPrice(data.totals.revenue), icon: '£' },
              { label: 'Total Orders',  value: String(data.totals.orders),        icon: '#' },
              { label: 'Avg Order',     value: formatPrice(data.totals.avgOrder),  icon: '~' },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="text-xs text-gray-500 mb-1">{s.label}</div>
                <div className="text-2xl font-black text-gray-900">{s.value}</div>
              </div>
            ))}
          </div>

          {/* Revenue bar chart */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-red-600" /> Revenue
            </h2>
            <div className="flex items-end gap-2 h-40 overflow-x-auto pb-1">
              {data.data.map((d) => (
                <div key={d.date} className="flex flex-col items-center gap-1 flex-1 min-w-9">
                  <div className="text-[10px] text-gray-500 font-medium">
                    {formatPrice(d.revenue)}
                  </div>
                  <div
                    className="w-full rounded-t-lg bg-red-500 hover:bg-red-600 transition-colors cursor-default"
                    style={{ height: `${Math.max(4, (d.revenue / maxRevenue) * 96)}px` }}
                    title={`${d.date}: ${formatPrice(d.revenue)} (${d.orders} orders)`}
                  />
                  <div className="text-[10px] text-gray-400 whitespace-nowrap">{d.date}</div>
                </div>
              ))}
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
