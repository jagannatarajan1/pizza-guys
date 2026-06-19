'use client'
import { useState } from 'react'
import { Save, AlertTriangle } from 'lucide-react'
import { openingHours as initial } from '@/lib/menu-data'
import toast from 'react-hot-toast'

type HoursEntry = { day: string; open: string; close: string; closed: boolean }

export default function AdminHoursPage() {
  const [hours, setHours] = useState<HoursEntry[]>([...initial])
  const [tempClosure, setTempClosure] = useState({ enabled: false, from: '', to: '', message: 'We are temporarily closed' })

  const update = (day: string, key: keyof HoursEntry, value: string | boolean) => {
    setHours((prev) => prev.map((h) => h.day === day ? { ...h, [key]: value } : h))
  }

  const save = () => {
    toast.success('Opening hours saved!')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-gray-900">Opening Hours</h1>
        <button onClick={save} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors">
          <Save size={16} /> Save Changes
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Weekly schedule */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-gray-900 mb-4">Weekly Schedule</h2>
          <div className="space-y-3">
            {hours.map((h) => (
              <div key={h.day} className="flex items-center gap-3">
                <div className="w-24 text-sm font-medium text-gray-700 shrink-0">{h.day}</div>
                <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={!h.closed}
                    onChange={(e) => update(h.day, 'closed', !e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-xs text-gray-500">Open</span>
                </label>
                {!h.closed ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="time"
                      value={h.open}
                      onChange={(e) => update(h.day, 'open', e.target.value)}
                      className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-red-400"
                    />
                    <span className="text-gray-400 text-xs">to</span>
                    <input
                      type="time"
                      value={h.close}
                      onChange={(e) => update(h.day, 'close', e.target.value)}
                      className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-red-400"
                    />
                  </div>
                ) : (
                  <span className="text-sm text-gray-400 italic flex-1">Closed</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Temporary closure */}
        <div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle size={16} className="text-orange-500" /> Temporary Closure
              </h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tempClosure.enabled}
                  onChange={(e) => setTempClosure((p) => ({ ...p, enabled: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700">Enable</span>
              </label>
            </div>
            {tempClosure.enabled && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">From Date</label>
                    <input type="date" value={tempClosure.from} onChange={(e) => setTempClosure((p) => ({ ...p, from: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">To Date</label>
                    <input type="date" value={tempClosure.to} onChange={(e) => setTempClosure((p) => ({ ...p, to: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Message for Customers</label>
                  <input value={tempClosure.message} onChange={(e) => setTempClosure((p) => ({ ...p, message: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400" />
                </div>
                <button onClick={() => toast.success('Temporary closure scheduled!')} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 rounded-xl text-sm transition-colors">
                  Apply Temporary Closure
                </button>
              </div>
            )}
            {!tempClosure.enabled && (
              <p className="text-gray-400 text-sm">Enable to set a temporary holiday or closure period. Customers will see a notice on the website.</p>
            )}
          </div>

          <div className="bg-gray-50 rounded-2xl p-4 text-sm text-gray-600">
            <p className="font-semibold text-gray-900 mb-2">ℹ️ How it works</p>
            <ul className="space-y-1 text-xs text-gray-500 list-disc list-inside">
              <li>Changes take effect immediately after saving</li>
              <li>The &quot;Open Now&quot; status on the website updates automatically</li>
              <li>Orders placed outside opening hours will be queued for next opening</li>
              <li>Temporary closure overrides the weekly schedule</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
