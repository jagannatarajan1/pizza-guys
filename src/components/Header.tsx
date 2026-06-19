'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingCart, Menu, X, User, ChevronDown, LogOut, LayoutDashboard, ClipboardList } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCartStore } from '@/lib/cart-store'
import { useAuth } from '@/lib/auth-context'
import BrandLogo from '@/components/BrandLogo'

const navLinks = [
  { href: '/',        label: 'Home' },
  { href: '/menu',    label: 'Menu' },
  { href: '/offers',  label: 'Offers' },
  { href: '/about',   label: 'About' },
  { href: '/contact', label: 'Contact' },
]

export default function Header() {
  const [mobileOpen, setMobileOpen]   = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [scrolled, setScrolled]       = useState(false)
  const pathname   = usePathname()
  const itemCount  = useCartStore((s) => s.getItemCount())
  const { user, logout } = useAuth()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setMobileOpen(false); setUserMenuOpen(false) }, [pathname])

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-[#111]/95 backdrop-blur-md shadow-xl shadow-black/30'
        : 'bg-[#111]'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-18">

          {/* ── Logo ─────────────────────────────────── */}
          <BrandLogo size="sm" />

          {/* ── Desktop nav ──────────────────────────── */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {navLinks.map((link) => {
              const active = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-4 py-2 rounded-lg font-700 text-sm transition-colors duration-150 ${
                    active ? 'text-[#FFD700]' : 'text-gray-300 hover:text-white hover:bg-white/8'
                  }`}
                >
                  {link.label}
                  {active && (
                    <motion.span
                      layoutId="nav-indicator"
                      className="absolute bottom-0.5 left-4 right-4 h-0.5 bg-[#FFD700] rounded-full"
                    />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* ── Right side ───────────────────────────── */}
          <div className="flex items-center gap-2">

            {/* Cart */}
            <Link
              href="/cart"
              className="relative flex items-center gap-2 bg-[#FFD700] hover:bg-[#E6C200] text-[#111] px-3 sm:px-4 py-2 rounded-xl font-800 text-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-yellow-400/30 active:translate-y-0"
            >
              <ShoppingCart size={17} strokeWidth={2.5} />
              <span className="hidden sm:inline font-black">Basket</span>
              <AnimatePresence>
                {itemCount > 0 && (
                  <motion.span
                    key={itemCount}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-2 -right-2 bg-[#E53935] text-white text-xs font-black w-5 h-5 rounded-full flex items-center justify-center shadow"
                  >
                    {itemCount > 99 ? '99+' : itemCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>

            {/* User dropdown (desktop) */}
            {user ? (
              <div className="relative hidden lg:block">
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-700 text-gray-300 hover:text-white hover:bg-white/8 transition-colors"
                >
                  <div className="w-7 h-7 bg-[#FFD700] rounded-full flex items-center justify-center">
                    <span className="text-[#111] font-black text-xs">{user.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <span className="max-w-24 truncate">{user.name.split(' ')[0]}</span>
                  <ChevronDown size={13} className={`transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0,  scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-12 bg-[#1A1A1A] border border-white/10 rounded-2xl shadow-2xl py-2 w-52 z-50"
                    >
                      <Link href="/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/8 transition-colors">
                        <LayoutDashboard size={15} /> My Account
                      </Link>
                      <Link href="/order-tracking" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/8 transition-colors">
                        <ClipboardList size={15} /> Order History
                      </Link>
                      <div className="mx-3 my-1 h-px bg-white/10" />
                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut size={15} /> Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-700 text-gray-300 hover:text-white hover:bg-white/8 transition-colors"
              >
                <User size={16} /> Login
              </Link>
            )}

            {/* Hamburger */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="lg:hidden p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/8 transition-colors"
              aria-label="Toggle menu"
            >
              <AnimatePresence mode="wait">
                {mobileOpen
                  ? <motion.span key="x"    initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}><X size={22} /></motion.span>
                  : <motion.span key="menu" initial={{ rotate:  90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}><Menu size={22} /></motion.span>
                }
              </AnimatePresence>
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile menu ──────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="lg:hidden overflow-hidden border-t border-white/8"
          >
            <div className="bg-[#111] px-4 pb-5 pt-2">
              <nav className="flex flex-col gap-0.5 mb-3">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      href={link.href}
                      className={`flex items-center px-4 py-3 rounded-xl font-700 text-sm transition-colors ${
                        pathname === link.href
                          ? 'bg-[#FFD700]/15 text-[#FFD700]'
                          : 'text-gray-300 hover:bg-white/6 hover:text-white'
                      }`}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </nav>
              <div className="h-px bg-white/10 mb-3" />
              {user ? (
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-3 px-4 py-2.5 mb-1">
                    <div className="w-8 h-8 bg-[#FFD700] rounded-full flex items-center justify-center font-black text-[#111] text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-800 text-sm">{user.name}</p>
                      <p className="text-gray-400 text-xs">{user.email}</p>
                    </div>
                  </div>
                  <Link href="/dashboard" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-300 hover:bg-white/6 hover:text-white transition-colors">
                    <LayoutDashboard size={15} /> My Account
                  </Link>
                  <button
                    onClick={logout}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut size={15} /> Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link href="/login" className="flex-1 py-2.5 rounded-xl text-center text-sm font-800 text-white border border-white/20 hover:bg-white/8 transition-colors">
                    Login
                  </Link>
                  <Link href="/register" className="flex-1 py-2.5 rounded-xl text-center text-sm font-black bg-[#FFD700] text-[#111] hover:bg-[#E6C200] transition-colors">
                    Register
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
