'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, Check, X, ChevronDown, RefreshCw, Loader2, Printer, Timer, FastForward, Send, MessageCircle } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'
import { useSiteConfig } from '@/context/SiteConfigContext'
import { autoSteps, autoStepIndex, legacyNextStatus, formatMMSS } from '@/lib/prep-timer'
import { usePrepCountdown } from '@/lib/use-prep-countdown'

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

type Preset = { id: string; minutes: number }

// Accepting an order and setting its preparation clock are one action —
// there's no way to accept without choosing a time, so an accepted order
// always has the timing the auto-progress needs.
function AcceptOrderPicker({ order, presets, disabled, onAccept }: {
  order: Order
  presets: Preset[]
  disabled: boolean
  onAccept: (minutes: number) => void
}) {
  const [open, setOpen]     = useState(false)
  const [custom, setCustom] = useState('')

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors"
      >
        <Check size={13} /> Accept Order
      </button>
    )
  }

  const submitCustom = () => {
    const mins = parseInt(custom, 10)
    if (!Number.isInteger(mins) || mins < 1 || mins > 360) {
      toast.error('Enter a whole number of minutes between 1 and 360')
      return
    }
    onAccept(mins)
  }

  return (
    <div className="w-full bg-green-50 border border-green-200 rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-green-800">How long will #{order.orderNumber} take?</span>
        <button onClick={() => setOpen(false)} className="text-green-700 hover:text-green-900"><X size={14} /></button>
      </div>
      <div className="flex flex-wrap gap-2 mb-2">
        {presets.map((p) => (
          <button
            key={p.id}
            onClick={() => onAccept(p.minutes)}
            disabled={disabled}
            className="bg-white border border-green-300 hover:bg-green-600 hover:text-white hover:border-green-600 disabled:opacity-50 text-green-800 text-xs font-bold px-3 py-2 rounded-lg transition-colors"
          >
            {p.minutes} min
          </button>
        ))}
        {presets.length === 0 && (
          <span className="text-xs text-green-700">No preset times configured — enter one below.</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number" min="1" max="360" step="1"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submitCustom()}
          placeholder="Custom minutes"
          className="w-36 border border-green-300 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:border-green-500"
        />
        <button
          onClick={submitCustom}
          disabled={disabled || !custom}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
        >
          Accept
        </button>
      </div>
    </div>
  )
}

// Shown while an order is walking itself through the preparation steps. The
// "done early" button just moves it on ahead of schedule — the timer only
// ever advances an order, so it won't fight a manual jump.
function PrepCountdown({ order, disabled, onSkip }: {
  order: Order
  disabled: boolean
  onSkip: (nextStatus: string) => void
}) {
  const timing = usePrepCountdown(
    order.acceptedAt && order.prepMinutes
      ? { orderType: order.orderType, acceptedAt: order.acceptedAt, prepMinutes: order.prepMinutes }
      : null
  )
  if (!timing) return null

  const steps    = autoSteps(order.orderType)
  const nextStep = steps[timing.currentStepIndex + 1]
  const overdue  = timing.totalRemainingMs === 0

  return (
    <div className="w-full bg-orange-50 border border-orange-200 rounded-xl p-3">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
        <div>
          <div className="text-[10px] font-semibold text-orange-500 uppercase tracking-wide">Prep Time</div>
          <div className="text-xs font-bold text-orange-900">{order.prepMinutes} min</div>
        </div>
        <div>
          <div className="text-[10px] font-semibold text-orange-500 uppercase tracking-wide">Remaining</div>
          <div className={`text-xs font-bold tabular-nums ${overdue ? 'text-red-600' : 'text-orange-900'}`}>
            {overdue ? 'Overdue' : formatMMSS(timing.totalRemainingMs)}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-semibold text-orange-500 uppercase tracking-wide">Current Step</div>
          <div className="text-xs font-bold text-orange-900">{timing.currentAutoStatus}</div>
        </div>
        {nextStep && !overdue && (
          <div>
            <div className="text-[10px] font-semibold text-orange-500 uppercase tracking-wide">Next</div>
            <div className="text-xs font-bold text-orange-900 tabular-nums">
              {nextStep} in {formatMMSS(timing.remainingMs)}
            </div>
          </div>
        )}
        <div>
          <div className="text-[10px] font-semibold text-orange-500 uppercase tracking-wide">Ready By</div>
          <div className="text-xs font-bold text-orange-900">
            {timing.completionAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        <button
          onClick={() => onSkip(nextStep ?? 'Completed')}
          disabled={disabled}
          className="ml-auto flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors"
          title="Move to the next step now, ahead of the timer"
        >
          <FastForward size={12} /> {nextStep ? `${nextStep} now` : 'Complete now'}
        </button>
      </div>
    </div>
  )
}

type OrderItemModifier = {
  groupId: string
  groupName: string
  options: { id: string; name: string; price: number }[]
}

type OrderItem = {
  id: string; productId: string; name: string; quantity: number; unitPrice: number; itemTotal: number
  modifiers: OrderItemModifier[]; specialInstructions: string
}

type OrderMessage = { id: string; message: string; createdBy: string | null; createdAt: string }

// Matches TERMINAL_STATUSES in the messages API — an order in either state
// has nothing left to send an update about.
const TERMINAL_STATUSES = ['Completed', 'Cancelled']

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
  acceptedAt: string | null
  prepMinutes: number | null
  createdAt: string
  items: OrderItem[]
  messages: OrderMessage[]
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
  const [presets, setPresets]           = useState<Preset[]>([])
  const [messageDrafts, setMessageDrafts] = useState<Record<string, string>>({})
  const [sendingMessageId, setSendingMessageId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/prep-time-presets')
      .then((r) => r.json())
      .then((d) => setPresets(d.presets ?? []))
      .catch(() => {})
  }, [])

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
      : `<div style="width:64px;height:64px;border-radius:50%;background:${dark};color:#fff;font-size:23px;font-weight:900;line-height:64px;text-align:center;margin:0 auto 8px">${abbr}</div>`

    const itemRows = order.items.map((item) => {
      const modLines = item.modifiers.map((m) =>
        `${m.groupName}: ${m.options.map((o) => o.name).join(', ')}`
      ).join('<br/>')
      return `
      <tr>
        <td style="padding:5px 0;vertical-align:top">${item.quantity}×</td>
        <td style="padding:5px 8px;vertical-align:top">
          ${item.name}
          ${modLines ? `<br/><span style="font-size:12px;color:#888">${modLines}</span>` : ''}
          ${item.specialInstructions ? `<br/><span style="font-size:12px;font-weight:700">Note: ${item.specialInstructions}</span>` : ''}
        </td>
        <td style="padding:5px 0;text-align:right;vertical-align:top;white-space:nowrap">${formatPrice(item.itemTotal)}</td>
      </tr>`
    }).join('')

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt #${order.orderNumber}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Courier New', Courier, monospace; font-size: 15px; color: #111; background: #fff; width: 80mm; margin: 0 auto; padding: 16px 12px; }
    .center { text-align: center; }
    .bold { font-weight: 700; }
    .divider { border: none; border-top: 1px dashed #999; margin: 10px 0; }
    .divider-solid { border: none; border-top: 2px solid #111; margin: 10px 0; }
    table { width: 100%; border-collapse: collapse; }
    td { font-size: 14px; }
    .total-row td { font-size: 17px; font-weight: 900; padding-top: 6px; }
    .badge { display:inline-block; background:${primary}; color:#fff; font-size:12px; font-weight:700; padding:2px 8px; border-radius:4px; letter-spacing:1px; }
    @media print {
      body { margin: 0; padding: 8px; }
      @page { margin: 0; size: 80mm auto; }
    }
  </style>
</head>
<body>
  <div class="center" style="margin-bottom:12px">
    ${logoHtml}
    <div style="font-size:23px;font-weight:900;letter-spacing:1px">${bizName.toUpperCase()}</div>
    ${bizAddr ? `<div style="font-size:13px;color:#555;margin-top:3px">${bizAddr}</div>` : ''}
    ${bizPhone ? `<div style="font-size:13px;color:#555">Tel: ${bizPhone}</div>` : ''}
    ${bizEmail ? `<div style="font-size:13px;color:#555">${bizEmail}</div>` : ''}
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
        <th style="text-align:left;padding-bottom:4px;font-size:13px;color:#555" colspan="2">ITEM</th>
        <th style="text-align:right;padding-bottom:4px;font-size:13px;color:#555">PRICE</th>
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
    <tr><td style="font-size:13px;color:#666">Payment</td><td style="text-align:right;font-size:13px;color:#666;text-transform:capitalize">${order.paymentMethod}</td></tr>
  </table>

  <hr class="divider-solid">

  <div class="center" style="font-size:13px;color:#888;margin-top:8px">
    <div style="font-weight:700;font-size:15px;margin-bottom:4px">Thank you for your order!</div>
    <div>Please come again 🍕</div>
    <div style="margin-top:8px;font-size:12px">Status: <strong>${order.status}</strong></div>
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

  // Safety-net refresh in case the live connection below ever drops for a
  // while — the live push is the real mechanism for "no delay".
  useEffect(() => {
    const iv = setInterval(() => load(statusFilter, search), 30_000)
    return () => clearInterval(iv)
  }, [statusFilter, search, load])

  // Live push: the instant a new order is paid, or any order's status
  // changes, refresh this list right away instead of waiting for the next
  // poll. The beep + popup alert itself lives in the admin layout (so it
  // fires on every admin page, not just this one) — this connection is only
  // for keeping the list on THIS page current while it's open. Kept as one
  // persistent connection (not reopened on every filter change) using a ref
  // so the handler always reads the current filter/search values.
  const filterRef = useRef({ statusFilter, search })
  useEffect(() => { filterRef.current = { statusFilter, search } }, [statusFilter, search])

  useEffect(() => {
    const es = new EventSource('/api/admin/orders/stream')
    es.onmessage = () => load(filterRef.current.statusFilter, filterRef.current.search)
    return () => es.close()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateStatus = async (order: Order, newStatus: string, prepMinutes?: number) => {
    setUpdatingId(order.id)
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prepMinutes ? { status: newStatus, prepMinutes } : { status: newStatus }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) { toast.error(data?.error ?? 'Failed to update order'); return }
      setOrders((prev) => prev.map((o) => o.id === order.id
        ? { ...o, status: newStatus, acceptedAt: data?.acceptedAt ?? o.acceptedAt, prepMinutes: data?.prepMinutes ?? o.prepMinutes }
        : o))
      toast.success(`#${order.orderNumber} → ${newStatus}`)
    } catch {
      toast.error('Failed to update order')
    } finally {
      setUpdatingId(null)
    }
  }

  const sendMessage = async (order: Order) => {
    const text = (messageDrafts[order.id] ?? '').trim()
    if (!text) return
    setSendingMessageId(order.id)
    try {
      const res  = await fetch(`/api/admin/orders/${order.id}/messages`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ message: text }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) { toast.error(data?.error ?? 'Failed to send message'); return }
      setOrders((prev) => prev.map((o) =>
        o.id === order.id ? { ...o, messages: [...o.messages, data.message] } : o
      ))
      setMessageDrafts((prev) => ({ ...prev, [order.id]: '' }))
      toast.success(`Message sent to ${order.customerName}`)
    } catch {
      toast.error('Failed to send message')
    } finally {
      setSendingMessageId(null)
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
                      <div key={idx} className="flex justify-between text-sm py-2 border-b border-gray-50 last:border-0 gap-3">
                        <div className="min-w-0">
                          <span className="text-gray-700 font-semibold">{item.quantity}× {item.name}</span>
                          {item.modifiers.length > 0 && (
                            <ul className="mt-1 space-y-0.5">
                              {item.modifiers.map((mod) => (
                                <li key={mod.groupId} className="text-xs text-gray-500">
                                  <span className="font-medium text-gray-600">{mod.groupName}:</span>{' '}
                                  {mod.options.map((o) => o.name).join(', ')}
                                </li>
                              ))}
                            </ul>
                          )}
                          {item.specialInstructions && (
                            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-2 py-1 mt-1.5 inline-block font-medium">
                              Note: {item.specialInstructions}
                            </div>
                          )}
                        </div>
                        <span className="font-medium shrink-0">{formatPrice(item.itemTotal)}</span>
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

                  {/* Messages to the customer — shown live on their /order-tracking
                      page over the same connection that already pushes status
                      changes. Sendable any time up until the order is done. */}
                  <div className="mb-4">
                    <div className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
                      <MessageCircle size={13} /> Messages to customer
                    </div>
                    {order.messages.length > 0 && (
                      <div className="space-y-1.5 mb-2">
                        {order.messages.map((m) => (
                          <div key={m.id} className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                            <p className="text-sm text-gray-800">{m.message}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">{fmtTime(m.createdAt)} · {fmtDate(m.createdAt)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {TERMINAL_STATUSES.includes(order.status) ? (
                      <p className="text-xs text-gray-400 italic">This order is complete — no further messages can be sent.</p>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          value={messageDrafts[order.id] ?? ''}
                          onChange={(e) => setMessageDrafts((prev) => ({ ...prev, [order.id]: e.target.value }))}
                          onKeyDown={(e) => e.key === 'Enter' && sendMessage(order)}
                          maxLength={500}
                          placeholder="e.g. Running about 10 minutes late — sorry!"
                          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400"
                        />
                        <button
                          onClick={() => sendMessage(order)}
                          disabled={sendingMessageId === order.id || !(messageDrafts[order.id] ?? '').trim()}
                          className="shrink-0 flex items-center gap-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors"
                        >
                          {sendingMessageId === order.id ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                          Send
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      const stepIdx  = autoStepIndex(order.orderType, order.status)
                      const steps    = autoSteps(order.orderType)
                      const hasTimer = !!order.acceptedAt && !!order.prepMinutes
                      const isNew    = order.status === 'New' || order.status === 'confirmed'
                      // Mid-preparation with a running clock: 'Accepted' (not
                      // yet a step) or any step before the last one.
                      const autoRunning = hasTimer && (order.status === 'Accepted' || (stepIdx !== -1 && stepIdx < steps.length - 1))
                      const nextStatus = legacyNextStatus(order.orderType, order.status)

                      if (isNew) {
                        return (
                          <AcceptOrderPicker
                            order={order}
                            presets={presets}
                            disabled={!!updatingId}
                            onAccept={(minutes) => updateStatus(order, 'Accepted', minutes)}
                          />
                        )
                      }
                      if (autoRunning) {
                        return (
                          <PrepCountdown
                            order={order}
                            disabled={!!updatingId}
                            onSkip={(next) => updateStatus(order, next)}
                          />
                        )
                      }
                      // Final step, or an order from before prep timing
                      // existed — a plain manual advance either way.
                      if (!nextStatus) return null
                      return (
                        <button
                          onClick={() => updateStatus(order, nextStatus)}
                          disabled={!!updatingId}
                          className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors"
                        >
                          {updatingId === order.id
                            ? <Loader2 size={13} className="animate-spin" />
                            : <Check size={13} />
                          }
                          {nextStatus}
                        </button>
                      )
                    })()}
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
