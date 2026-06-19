'use client'
import { useState } from 'react'
import { Search, Eye } from 'lucide-react'

const CUSTOMERS = [
  { id: 'C001', name: 'Sarah Jones', email: 'sarah@example.com', phone: '07700901111', orders: 18, total: 287.42, joined: '2024-01-15', lastOrder: '2025-06-18' },
  { id: 'C002', name: 'Mike Peters', email: 'mike@example.com', phone: '07700902222', orders: 12, total: 198.76, joined: '2024-03-22', lastOrder: '2025-06-15' },
  { id: 'C003', name: 'Emma Davis', email: 'emma@example.com', phone: '07700903333', orders: 25, total: 412.55, joined: '2023-11-10', lastOrder: '2025-06-12' },
  { id: 'C004', name: 'James Wilson', email: 'james@example.com', phone: '07700904444', orders: 8, total: 134.99, joined: '2024-08-05', lastOrder: '2025-06-10' },
  { id: 'C005', name: 'Lisa Brown', email: 'lisa@example.com', phone: '07700905555', orders: 31, total: 523.80, joined: '2023-06-20', lastOrder: '2025-06-08' },
  { id: 'C006', name: 'Tom Hall', email: 'tom@example.com', phone: '07700906666', orders: 5, total: 79.45, joined: '2025-02-14', lastOrder: '2025-05-30' },
]

export default function AdminCustomersPage() {
  const [search, setSearch] = useState('')
  const filtered = CUSTOMERS.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-gray-900">Customers</h1>
        <div className="text-sm text-gray-500">{CUSTOMERS.length} total customers</div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email or phone..." className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-red-400" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Phone</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Orders</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Total Spend</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Last Order</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-red-600 font-bold text-xs">{c.name.charAt(0)}</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{c.name}</div>
                        <div className="text-xs text-gray-400">{c.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{c.phone}</td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-gray-900">{c.orders}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-gray-900">£{c.total.toFixed(2)}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">
                    {new Date(c.lastOrder).toLocaleDateString('en-GB')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"><Eye size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
