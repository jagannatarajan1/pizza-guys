'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, ShoppingBag, Package, Grid3X3, Settings,
  Tag, Users, Truck, Clock, BarChart2, ChevronLeft, Menu, X,
  SlidersHorizontal, UserCog, ShieldCheck, Bell,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { canAccess, ROLE_LABELS } from '@/lib/roles'
import { unlockAudio, playNewOrderBeep } from '@/lib/beep'

const NAV = [
  { href: '/admin',            label: 'Dashboard',      icon: LayoutDashboard },
  { href: '/admin/orders',     label: 'Orders',         icon: ShoppingBag },
  { href: '/admin/products',   label: 'Products',       icon: Package },
  { href: '/admin/categories', label: 'Categories',     icon: Grid3X3 },
  { href: '/admin/modifiers',  label: 'Modifiers',      icon: Settings },
  { href: '/admin/offers',     label: 'Offers',         icon: Tag },
  { href: '/admin/customers',  label: 'Customers',      icon: Users },
  { href: '/admin/delivery',   label: 'Delivery',       icon: Truck },
  { href: '/admin/hours',      label: 'Opening Hours',  icon: Clock },
  { href: '/admin/settings',   label: 'Site Settings',  icon: SlidersHorizontal },
  { href: '/admin/reports',    label: 'Reports',        icon: BarChart2 },
  { href: '/admin/users',      label: 'Staff & Roles',  icon: UserCog },
  { href: '/admin/security',   label: 'Security (2FA)', icon: ShieldCheck },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname            = usePathname()
  const router              = useRouter()
  const [sidebarOpen, setSidebarOpen]           = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [role, setRole]                         = useState<string>('admin')

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => { if (d.user?.role) setRole(d.user.role) })
      .catch(() => {})
  }, [])

  // New-order alert lives here (not on the Orders page itself) so it fires
  // no matter which admin page someone is currently looking at — Settings,
  // Menu, wherever. Beeps and shows a clickable popup; tapping it jumps
  // straight to Orders.
  useEffect(() => {
    unlockAudio()
    const onFirstClick = () => unlockAudio()
    window.addEventListener('click', onFirstClick, { once: true })

    const es = new EventSource('/api/admin/orders/stream')
    es.onmessage = (e) => {
      let data: { type?: string; orderNumber?: string } = {}
      try { data = JSON.parse(e.data) } catch { return }
      if (data.type !== 'new-order') return

      playNewOrderBeep()
      toast.custom(
        (t) => (
          <div
            onClick={() => { router.push('/admin/orders'); toast.dismiss(t.id) }}
            className="cursor-pointer bg-white border-2 border-red-500 rounded-2xl shadow-xl p-4 flex items-center gap-3 max-w-sm"
          >
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shrink-0">
              <Bell size={18} className="text-white" />
            </div>
            <div className="min-w-0">
              <div className="font-black text-gray-900 text-sm">New Order Received!</div>
              <div className="text-xs text-gray-500 truncate">#{data.orderNumber} — tap to view</div>
            </div>
          </div>
        ),
        { duration: 10_000 }
      )
    }

    return () => {
      es.close()
      window.removeEventListener('click', onFirstClick)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const visibleNav = NAV.filter((item) => canAccess(role, item.href))

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col bg-gray-900 text-white transition-all duration-200 ${sidebarOpen ? 'w-56' : 'w-16'}`}>
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-red-600 rounded-lg flex items-center justify-center shrink-0">
                <span className="text-white font-black text-xs">PG</span>
              </div>
              <span className="font-black text-sm">Admin Panel</span>
            </div>
          )}
          <button onClick={() => setSidebarOpen((v) => !v)} className="p-1 rounded-lg hover:bg-gray-800 transition-colors ml-auto">
            <ChevronLeft size={16} className={`transition-transform ${sidebarOpen ? '' : 'rotate-180'}`} />
          </button>
        </div>
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {visibleNav.map((item) => {
            const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href} title={!sidebarOpen ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm font-medium ${active ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                <item.icon size={17} className="shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>
        <div className="px-4 py-4 border-t border-gray-800 space-y-2">
          {sidebarOpen && (
            <div className="text-xs text-gray-500 px-1">
              Role: <span className="text-gray-300 font-semibold">{ROLE_LABELS[role] ?? role}</span>
            </div>
          )}
          <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white text-xs transition-colors">
            <span>← Back to site</span>
          </Link>
        </div>
      </aside>

      {/* Mobile sidebar */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileSidebarOpen(false)} />
          <aside className="relative w-56 bg-gray-900 text-white flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800">
              <span className="font-black text-sm">Admin Panel</span>
              <button onClick={() => setMobileSidebarOpen(false)}><X size={16} className="text-gray-400" /></button>
            </div>
            <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
              {visibleNav.map((item) => {
                const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
                return (
                  <Link key={item.href} href={item.href} onClick={() => setMobileSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm font-medium ${active ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                    <item.icon size={16} className="shrink-0" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
          <button onClick={() => setMobileSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Menu size={20} />
          </button>
          <span className="font-black text-gray-900">Admin Panel</span>
        </div>
        <main className="flex-1 p-4 sm:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
