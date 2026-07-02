'use client'
import { useState, useEffect, useCallback } from 'react'
import { Search, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

type Customer = {
  id: string
  name: string
  email: string
  phone: string
  emailVerified: boolean
  orderCount: number
  totalSpend: number
  joined: string
  lastOrder: string | null
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [total, setTotal]         = useState(0)

  const load = useCallback(async (q: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set('search', q)
      const res  = await fetch(`/api/admin/customers?${params}`)
      const data = await res.json()
      setCustomers(data.customers ?? [])
      setTotal(data.total ?? 0)
    } catch {
      toast.error('Failed to load customers')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => load(search), 300)
    return () => clearTimeout(t)
  }, [search, load])

  const fmtDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-gray-900">
          Customers
          {!loading && <span className="ml-2 text-sm font-semibold text-gray-400">({total})</span>}
        </h1>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or phone…"
            className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-red-400"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 size={24} className="animate-spin mr-2" /> Loading…
        </div>
      ) : customers.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No customers found</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Verified</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Phone</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Orders</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Total Spend</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Joined</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Last Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                          <span className="text-red-600 font-bold text-xs">{c.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{c.name}</div>
                          <div className="text-xs text-gray-400">{c.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {c.emailVerified
                        ? <span title="Verified"><CheckCircle2 size={16} className="text-green-500" /></span>
                        : <span title="Unverified"><XCircle size={16} className="text-amber-400" /></span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{c.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-gray-900">{c.orderCount}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-gray-900">{formatPrice(c.totalSpend)}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden lg:table-cell text-xs">{fmtDate(c.joined)}</td>
                    <td className="px-4 py-3 text-gray-500 hidden lg:table-cell text-xs">{fmtDate(c.lastOrder)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
