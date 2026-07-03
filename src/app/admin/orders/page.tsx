'use client'
import { useState, useEffect, useCallback } from 'react'
import { Search, Check, X, ChevronDown, RefreshCw, Loader2, Printer } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'
import { useSiteConfig } from '@/context/SiteConfigContext'

const STATUSES = ['All', 'confirmed', 'New', 'Accepted', 'Preparing', 'Ready', 'Out for Delivery', 'Completed', 'Cancelled']

const STATUS_COLOURS: Record<string, string> = {
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

const STATUS_LABEL: Record<string, string> = {
  pending_payment: 'Payment Pending',
  confirmed:       'New (Online)',
}

const NEXT_STATUS: Record<string, string> = {
  confirmed:          'Accepted',
  New:                'Accepted',
  Accepted:           'Preparing',
  Preparing:          'Ready',
  Ready:              'Out for Delivery',
  'Out for Delivery': 'Completed',
}

type OrderItem = {
  id: string; name: string; quantity: number; unitPrice: number; itemTotal: number; specialInstructions: string
}

type Order = {
  id: string
  orderNumber: string
  status: string
  orderType: string
  customerName: string
  customerEmail: string
  customerPhone: string
  deliveryAddress: string | null
  subtotal: number
  deliveryFee: number
  discount: number
  total: number
  paymentMethod: string
  createdAt: string
  items: OrderItem[]
}

export default function AdminOrdersPage() {
  const cfg = useSiteConfig()
  const [orders, setOrders]             = useState<Order[]>([])
  const [loading, setLoading]           = useState(true)
  const [statusFilter, setStatusFilter] = useState('All')
  const [search, setSearch]             = useState('')
  const [expanded, setExpanded]         = useState<string | null>(null)
  const [updatingId, setUpdatingId]     = useState<string | null>(null)
  const [total, setTotal]               = useState(0)

  const printReceipt = (order: Order) => {
    const bizName    = cfg.biz_name    || 'Pizza Guys'
    const bizAddr    = cfg.biz_address || ''
    const bizPhone   = cfg.biz_phone   || ''
    const bizEmail   = cfg.biz_email   || ''
    const primary    = cfg.theme_primary || '#E53935'
    const dark       = cfg.theme_dark    || '#111111'
    const abbr       = (cfg.biz_logo_abbr || 'PG').slice(0, 3)
    const logoImg    = cfg.biz_logo_image || ''
    const date       = new Date(order.createdAt)
    const dateStr    = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    const timeStr    = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    const addr       = order.deliveryAddress ? (() => { try { return JSON.parse(order.deliveryAddress!) } catch { return null } })() : null

    const logoHtml = logoImg
      ? `<img src="${logoImg}" alt="${bizName}" style="width:64px;height:64px;border-radius:50%;object-fit:cover;display:block;margin:0 auto 8px" />`
      : `<div style="width:64px;height:64px;border-radius:50%;background:${dark};color:#fff;font-size:20px;font-weight:900;line-height:64px;text-align:center;margin:0 auto 8px">${abbr}</div>`

    const itemRows = order.items.map((item) => `
      <tr>
        <td style="padding:5px 0;vertical-align:top">${item.quantity}×</td>
        <td style="padding:5px 8px;vertical-align:top">${item.name}${item.specialInstructions ? `<br/><span style="font-size:10px;color:#888">${item.specialInstructions}</span>` : ''}</td>
        <td style="padding:5px 0;text-align:right;vertical-align:top;white-space:nowrap">${formatPrice(item.itemTotal)}</td>
      </tr>`).join('')

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt #${order.orderNumber}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Courier New', Courier, monospace; font-size: 13px; color: #111; background: #fff; width: 80mm; margin: 0 auto; padding: 16px 12px; }
    .center { text-align: center; }
    .bold { font-weight: 700; }
    .divider { border: none; border-top: 1px dashed #999; margin: 10px 0; }
    .divider-solid { border: none; border-top: 2px solid #111; margin: 10px 0; }
    table { width: 100%; border-collapse: collapse; }
    td { font-size: 12px; }
    .total-row td { font-size: 14px; font-weight: 900; padding-top: 6px; }
    .badge { display:inline-block; background:${primary}; color:#fff; font-size:10px; font-weight:700; padding:2px 8px; border-radius:4px; letter-spacing:1px; }
    @media print {
      body { margin: 0; padding: 8px; }
      @page { margin: 0; size: 80mm auto; }
    }
  </style>
</head>
<body>
  <div class="center" style="margin-bottom:12px">
    ${logoHtml}
    <div style="font-size:20px;font-weight:900;letter-spacing:1px">${bizName.toUpperCase()}</div>
    ${bizAddr ? `<div style="font-size:11px;color:#555;margin-top:3px">${bizAddr}</div>` : ''}
    ${bizPhone ? `<div style="font-size:11px;color:#555">Tel: ${bizPhone}</div>` : ''}
    ${bizEmail ? `<div style="font-size:11px;color:#555">${bizEmail}</div>` : ''}
  </div>

  <hr class="divider-solid">

  <div style="margin-bottom:8px">
    <div class="center"><span class="badge">${order.orderType === 'delivery' ? '🚚 DELIVERY' : '🏪 COLLECTION'}</span></div>
    <table style="margin-top:8px">
      <tr><td class="bold">Order #</td><td style="text-align:right">${order.orderNumber}</td></tr>
      <tr><td class="bold">Date</td><td style="text-align:right">${dateStr}</td></tr>
      <tr><td class="bold">Time</td><td style="text-align:right">${timeStr}</td></tr>
      <tr><td class="bold">Customer</td><td style="text-align:right">${order.customerName}</td></tr>
      ${order.customerPhone ? `<tr><td class="bold">Phone</td><td style="text-align:right">${order.customerPhone}</td></tr>` : ''}
      ${addr ? `<tr><td class="bold" style="vertical-align:top">Address</td><td style="text-align:right">${[addr.line1, addr.line2, addr.city, addr.postcode].filter(Boolean).join(', ')}</td></tr>` : ''}
    </table>
  </div>

  <hr class="divider">

  <table>
    <thead>
      <tr>
        <th style="text-align:left;padding-bottom:4px;font-size:11px;color:#555" colspan="2">ITEM</th>
        <th style="text-align:right;padding-bottom:4px;font-size:11px;color:#555">PRICE</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <hr class="divider">

  <table>
    <tr><td>Subtotal</td><td style="text-align:right">${formatPrice(order.subtotal)}</td></tr>
    ${order.deliveryFee > 0 ? `<tr><td>Delivery</td><td style="text-align:right">${formatPrice(order.deliveryFee)}</td></tr>` : ''}
    ${order.discount > 0 ? `<tr><td>Discount</td><td style="text-align:right">−${formatPrice(order.discount)}</td></tr>` : ''}
    <tr class="total-row">
      <td>TOTAL</td>
      <td style="text-align:right">${formatPrice(order.total)}</td>
    </tr>
    <tr><td style="font-size:11px;color:#666">Payment</td><td style="text-align:right;font-size:11px;color:#666;text-transform:capitalize">${order.paymentMethod}</td></tr>
  </table>

  <hr class="divider-solid">

  <div class="center" style="font-size:11px;color:#888;margin-top:8px">
    <div style="font-weight:700;font-size:13px;margin-bottom:4px">Thank you for your order!</div>
    <div>Please come again 🍕</div>
    <div style="margin-top:8px;font-size:10px">Status: <strong>${order.status}</strong></div>
  </div>
</body>
</html>`

    const win = window.open('', '_blank', 'width=400,height=700')
    if (!win) return
    win.document.documentElement.innerHTML = html
    win.onload = () => { win.focus(); win.print() }
    // fallback if onload already fired
    setTimeout(() => { win.focus(); win.print() }, 500)
  }

  const load = useCallback(async (status: string, q: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (status !== 'All') params.set('status', status)
      if (q) params.set('search', q)
      const res  = await fetch(`/api/admin/orders?${params}`)
      const data = await res.json()
      setOrders(data.orders ?? [])
      setTotal(data.total ?? 0)
    } catch {
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => load(statusFilter, search), 300)
    return () => clearTimeout(t)
  }, [statusFilter, search, load])

  // Auto-refresh every 30 s so new orders appear
  useEffect(() => {
    const iv = setInterval(() => load(statusFilter, search), 30_000)
    return () => clearInterval(iv)
  }, [statusFilter, search, load])

  const updateStatus = async (order: Order, newStatus: string) => {
    setUpdatingId(order.id)
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error()
      setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, status: newStatus } : o))
      toast.success(`#${order.orderNumber} → ${newStatus}`)
    } catch {
      toast.error('Failed to update order')
    } finally {
      setUpdatingId(null)
    }
  }

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-gray-900">
          Orders
          {!loading && <span className="ml-2 text-sm font-semibold text-gray-400">({total})</span>}
        </h1>
        <button
          onClick={() => load(statusFilter, search)}
          className="flex items-center gap-2 border border-gray-200 text-gray-600 font-bold px-3 py-2 rounded-xl text-sm hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order #, name or phone…"
              className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-red-400"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  statusFilter === s ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 size={24} className="animate-spin mr-2" /> Loading orders…
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No orders found</div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {/* Summary row */}
              <div
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-black text-gray-900">#{order.orderNumber}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOURS[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABEL[order.status] ?? order.status}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
                      {order.orderType}
                    </span>
                    <span className="text-xs text-gray-400">{fmtTime(order.createdAt)} · {fmtDate(order.createdAt)}</span>
                  </div>
                  <div className="text-sm text-gray-600 truncate">
                    {order.customerName} · {order.items.slice(0, 2).map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                    {order.items.length > 2 && ` +${order.items.length - 2} more`}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-black text-gray-900">{formatPrice(order.total)}</div>
                  <div className="text-xs text-gray-400 capitalize">{order.paymentMethod}</div>
                </div>
                <ChevronDown
                  size={16}
                  className={`text-gray-400 shrink-0 transition-transform ${expanded === order.id ? 'rotate-180' : ''}`}
                />
              </div>

              {/* Expanded detail */}
              {expanded === order.id && (
                <div className="px-4 pb-4 border-t border-gray-50 pt-4">
                  <div className="grid sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Customer</div>
                      <div className="font-semibold text-gray-900 text-sm">{order.customerName}</div>
                      <div className="text-sm text-gray-500">{order.customerPhone}</div>
                      <div className="text-xs text-gray-400">{order.customerEmail}</div>
                    </div>
                    {order.orderType === 'delivery' && order.deliveryAddress && (
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Delivery Address</div>
                        <div className="text-sm text-gray-600">
                          {(() => {
                            try {
                              const a = JSON.parse(order.deliveryAddress!)
                              return [a.line1, a.line2, a.city, a.postcode].filter(Boolean).join(', ')
                            } catch { return order.deliveryAddress }
                          })()}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <div className="text-xs text-gray-500 mb-2">Items</div>
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                        <div>
                          <span className="text-gray-700">{item.quantity}× {item.name}</span>
                          {item.specialInstructions && (
                            <div className="text-xs text-gray-400 mt-0.5 italic">Note: {item.specialInstructions}</div>
                          )}
                        </div>
                        <span className="font-medium">{formatPrice(item.itemTotal)}</span>
                      </div>
                    ))}
                    <div className="pt-2 mt-1 space-y-0.5 text-sm border-t border-gray-100">
                      {order.deliveryFee > 0 && (
                        <div className="flex justify-between text-gray-500">
                          <span>Delivery</span><span>{formatPrice(order.deliveryFee)}</span>
                        </div>
                      )}
                      {order.discount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Discount</span><span>−{formatPrice(order.discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-black text-gray-900 pt-1">
                        <span>Total</span><span>{formatPrice(order.total)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {NEXT_STATUS[order.status] && (
                      <button
                        onClick={() => updateStatus(order, NEXT_STATUS[order.status])}
                        disabled={!!updatingId}
                        className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors"
                      >
                        {updatingId === order.id
                          ? <Loader2 size={13} className="animate-spin" />
                          : <Check size={13} />
                        }
                        {NEXT_STATUS[order.status]}
                      </button>
                    )}
                    {order.status !== 'Cancelled' && order.status !== 'Completed' && (
                      <button
                        onClick={() => updateStatus(order, 'Cancelled')}
                        disabled={!!updatingId}
                        className="flex items-center gap-1.5 bg-red-100 hover:bg-red-200 disabled:opacity-50 text-red-700 text-xs font-bold px-3 py-2 rounded-xl transition-colors"
                      >
                        <X size={13} /> Cancel
                      </button>
                    )}
                    <button
                      onClick={() => printReceipt(order)}
                      className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-3 py-2 rounded-xl transition-colors"
                    >
                      <Printer size={13} /> Print
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
