'use client'
import { useState, useEffect, useCallback } from 'react'
import { Save, Clock, Truck, Store, Power, PowerOff, ToggleLeft, ToggleRight } from 'lucide-react'
import toast from 'react-hot-toast'

const DAYS = [
  { key: 'mon', label: 'Monday'    },
  { key: 'tue', label: 'Tuesday'   },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday'  },
  { key: 'fri', label: 'Friday'    },
  { key: 'sat', label: 'Saturday'  },
  { key: 'sun', label: 'Sunday'    },
] as const

type Config = Record<string, string>

export default function AdminHoursPage() {
  const [cfg, setCfg]         = useState<Config>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)

  const load = useCallback(async () => {
    try {
      const res  = await fetch('/api/admin/site-config', { credentials: 'include' })
      const data = await res.json()
      setCfg(data.config ?? {})
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const set = (key: string, value: string) =>
    setCfg((prev) => ({ ...prev, [key]: value }))

  const save = async (keys: string[]) => {
    setSaving(true)
    const payload: Config = {}
    keys.forEach((k) => { payload[k] = cfg[k] ?? '' })
    try {
      const res = await fetch('/api/admin/site-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ updates: payload }),
      })
      if (!res.ok) { toast.error('Save failed'); return }
      toast.success('Saved!')
    } finally {
      setSaving(false)
    }
  }

  const shopStatusKeys = ['shop_open', 'shop_delivery', 'shop_collection']
  const allHoursKeys   = DAYS.flatMap((d) => [
    `hours_${d.key}_open`,
    `hours_${d.key}_close`,
    `hours_${d.key}_closed`,
  ])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const shopOpen       = cfg.shop_open       !== 'false'
  const shopDelivery   = cfg.shop_delivery   !== 'false'
  const shopCollection = cfg.shop_collection !== 'false'

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Opening Hours & Shop Status</h1>
        <p className="text-sm text-gray-500 mt-1">Control when your shop takes orders</p>
      </div>

      {/* ── Shop Status ──────────────────────────────────────── */}
      <section className="bg-white rounded-2xl border-2 border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Power size={18} className="text-red-600" />
            <h2 className="font-black text-gray-900">Shop Status</h2>
          </div>
          <button
            onClick={() => save(shopStatusKeys)}
            disabled={saving}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-60"
          >
            <Save size={14} /> Save Status
          </button>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          {/* Shop toggle */}
          <button
            onClick={() => set('shop_open', shopOpen ? 'false' : 'true')}
            className={`flex items-center justify-between w-full p-4 rounded-2xl border-2 transition-all text-left ${shopOpen ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-700'}`}
          >
            <div className="flex items-center gap-3">
              {shopOpen ? <Power size={20} /> : <PowerOff size={20} />}
              <div>
                <div className="font-black text-sm">Shop</div>
                <div className="text-xs opacity-70">{shopOpen ? 'Accepting orders' : 'Not accepting orders'}</div>
              </div>
            </div>
            {shopOpen ? <ToggleRight size={28} /> : <ToggleLeft size={28} className="opacity-50" />}
          </button>

          {/* Delivery toggle */}
          <button
            onClick={() => set('shop_delivery', shopDelivery ? 'false' : 'true')}
            className={`flex items-center justify-between w-full p-4 rounded-2xl border-2 transition-all text-left ${shopDelivery ? 'border-blue-200 bg-blue-50 text-blue-800' : 'border-gray-200 bg-gray-50 text-gray-500'}`}
          >
            <div className="flex items-center gap-3">
              <Truck size={20} />
              <div>
                <div className="font-black text-sm">Delivery</div>
                <div className="text-xs opacity-70">{shopDelivery ? 'Delivery enabled' : 'Delivery disabled'}</div>
              </div>
            </div>
            {shopDelivery ? <ToggleRight size={28} /> : <ToggleLeft size={28} className="opacity-50" />}
          </button>

          {/* Collection toggle */}
          <button
            onClick={() => set('shop_collection', shopCollection ? 'false' : 'true')}
            className={`flex items-center justify-between w-full p-4 rounded-2xl border-2 transition-all text-left ${shopCollection ? 'border-purple-200 bg-purple-50 text-purple-800' : 'border-gray-200 bg-gray-50 text-gray-500'}`}
          >
            <div className="flex items-center gap-3">
              <Store size={20} />
              <div>
                <div className="font-black text-sm">Collection</div>
                <div className="text-xs opacity-70">{shopCollection ? 'Collection enabled' : 'Collection disabled'}</div>
              </div>
            </div>
            {shopCollection ? <ToggleRight size={28} /> : <ToggleLeft size={28} className="opacity-50" />}
          </button>
        </div>

        <p className="text-xs text-gray-400 mt-4">
          When Shop is <strong>OFF</strong>, customers can browse but cannot place orders, regardless of opening hours.
        </p>
      </section>

      {/* ── Opening Hours ─────────────────────────────────────── */}
      <section className="bg-white rounded-2xl border-2 border-gray-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-red-600" />
            <h2 className="font-black text-gray-900">Opening Hours</h2>
          </div>
          <button
            onClick={() => save(allHoursKeys)}
            disabled={saving}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-60"
          >
            <Save size={14} /> Save Hours
          </button>
        </div>

        <div className="space-y-2">
          {DAYS.map((day) => {
            const closedKey = `hours_${day.key}_closed`
            const openKey   = `hours_${day.key}_open`
            const closeKey  = `hours_${day.key}_close`
            const isClosed  = cfg[closedKey] === 'true'

            return (
              <div
                key={day.key}
                className={`grid grid-cols-[180px_1fr] gap-3 items-center p-3 rounded-xl border transition-all ${isClosed ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-100'}`}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => set(closedKey, isClosed ? 'false' : 'true')}
                    className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${isClosed ? 'bg-gray-300' : 'bg-green-500'}`}
                    aria-label={`Toggle ${day.label}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-150 ${isClosed ? '' : 'translate-x-5'}`} />
                  </button>
                  <span className="font-black text-sm text-gray-700 w-24">{day.label}</span>
                </div>

                {isClosed ? (
                  <div className="text-sm text-gray-400 font-semibold italic">Closed</div>
                ) : (
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-400 font-semibold">From</span>
                      <input
                        type="time"
                        value={cfg[openKey] || '11:00'}
                        onChange={(e) => set(openKey, e.target.value)}
                        className="border-2 border-gray-100 rounded-xl px-3 py-1.5 text-sm font-bold focus:outline-none focus:border-red-400 transition-colors"
                      />
                    </div>
                    <span className="text-gray-300 font-bold">–</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-400 font-semibold">To</span>
                      <input
                        type="time"
                        value={cfg[closeKey] || '23:00'}
                        onChange={(e) => set(closeKey, e.target.value)}
                        className="border-2 border-gray-100 rounded-xl px-3 py-1.5 text-sm font-bold focus:outline-none focus:border-red-400 transition-colors"
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <p className="text-xs text-gray-400 mt-4">
          Toggle the switch on each day to mark it open or closed. Ordering is only allowed during open hours when Shop Status is ON.
        </p>
      </section>
    </div>
  )
}
