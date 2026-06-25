'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { MapPin, Clock, ChevronRight, Star, Truck, Award, Heart, Zap } from 'lucide-react'
import { activeCoupons, openingHours, deliveryZones } from '@/lib/menu-data'
import { checkDelivery, isOpen, formatPrice } from '@/lib/utils'
import ProductModal from '@/components/ProductModal'
import type { Product, Category } from '@/lib/types'
import { useSiteConfig } from '@/context/SiteConfigContext'

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' as const } },
}

const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.08 } },
}

export default function HomePage() {
  const cfg = useSiteConfig()
  const [postcode, setPostcode] = useState('')
  const [deliveryResult, setDeliveryResult] = useState<{ available: boolean; fee: number; minOrder: number } | null | 'not-found'>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [popularProducts, setPopularProducts] = useState<Product[]>([])
  const [categories, setCategories]           = useState<Category[]>([])

  useEffect(() => {
    fetch('/api/menu/products').then((r) => r.json()).then((d) => {
      setPopularProducts((d.products ?? []).filter((p: Product) => p.popular))
    })
    fetch('/api/menu/categories').then((r) => r.json()).then((d) => {
      setCategories(d.categories ?? [])
    })
  }, [])

  const { isOpen: open, todayHours } = isOpen(openingHours)

  const handleDeliveryCheck = () => {
    if (!postcode.trim()) return
    setDeliveryResult(checkDelivery(postcode, deliveryZones) ?? 'not-found')
  }

  return (
    <>
      <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative bg-[#111] text-white overflow-hidden min-h-[88vh] flex items-center">
        {/* Background pizza image */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25"
          style={{ backgroundImage: popularProducts[0]?.image ? `url('${popularProducts[0].image}')` : undefined }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-r from-[#111] via-[#111]/80 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-t from-[#111] via-transparent to-transparent" />

        {/* Floating pizza emojis (decorative) */}
        <span className="absolute right-[10%] top-24 text-6xl float opacity-30 select-none hidden xl:block">🍕</span>
        <span className="absolute right-[25%] bottom-32 text-4xl float-delay opacity-20 select-none hidden xl:block">🍔</span>
        <span className="absolute right-[5%] bottom-24 text-5xl float opacity-25 select-none hidden xl:block">🌶️</span>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24 sm:py-32 w-full">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="max-w-2xl"
          >
            {/* Badge */}
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold px-4 py-2 rounded-full mb-6" style={{ background: 'color-mix(in srgb,var(--brand-accent) 15%,transparent)', border: '1px solid color-mix(in srgb,var(--brand-accent) 30%,transparent)', color: 'var(--brand-accent)' }}>
              {cfg.hero_badge}
            </motion.div>

            {/* Headline */}
            <motion.h1 variants={fadeUp} className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[0.95] mb-5 tracking-tight">
              {cfg.hero_title}<br />
              <span style={{ color: 'var(--brand-accent)' }}>{cfg.hero_title_accent}</span>
            </motion.h1>

            <motion.p variants={fadeUp} className="text-base sm:text-lg text-gray-300 mb-8 leading-relaxed max-w-xl">
              {cfg.hero_subtitle}
            </motion.p>

            {/* CTAs */}
            <motion.div variants={fadeUp} className="flex flex-wrap gap-3 mb-8">
              <Link href="/menu" className="btn-brand inline-flex items-center gap-2 px-7 py-3.5 text-base rounded-xl">
                {cfg.hero_cta1} <ChevronRight size={18} />
              </Link>
              <Link href="/menu" className="inline-flex items-center gap-2 px-7 py-3.5 text-base rounded-xl font-black bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all duration-150">
                {cfg.hero_cta2}
              </Link>
            </motion.div>

            {/* Stats row */}
            <motion.div variants={fadeUp} className="flex flex-wrap gap-5 text-sm text-gray-400">
              <div className="flex items-center gap-2"><Truck size={15} style={{ color: 'var(--brand-accent)' }} /> {cfg.hero_stat1}</div>
              <div className="flex items-center gap-2"><Star size={15} style={{ color: 'var(--brand-accent)', fill: 'var(--brand-accent)' }} /> {cfg.hero_stat2}</div>
              <div className="flex items-center gap-2"><Clock size={15} style={{ color: 'var(--brand-success)' }} /> {cfg.hero_stat3}</div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── DELIVERY CHECKER ─────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 -mt-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5, ease: [0.22,1,0.36,1] }}
          className="bg-white rounded-2xl shadow-2xl shadow-black/10 p-5 sm:p-6 border border-gray-100"
        >
          <h2 className="font-black text-gray-900 mb-3 flex items-center gap-2 text-base">
            <MapPin size={17} className="text-[#E53935]" /> Check if we deliver to you
          </h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleDeliveryCheck()}
              placeholder="Enter postcode e.g. TW18 1AB"
              className="flex-1 border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-[#FFD700] transition-colors"
            />
            <button
              onClick={handleDeliveryCheck}
              className="btn-brand px-5 py-3 rounded-xl text-sm shrink-0"
            >
              Check
            </button>
          </div>

          {deliveryResult === 'not-found' && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mt-3 p-3 bg-red-50 text-red-700 rounded-xl text-sm font-semibold flex items-center gap-2">
              ❌ Sorry, we don&apos;t deliver to your area yet. You can still collect in-store!
            </motion.div>
          )}
          {deliveryResult && deliveryResult !== 'not-found' && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mt-3 p-3 bg-green-50 text-green-700 rounded-xl text-sm font-semibold flex items-center gap-2">
              ✅ We deliver to you! Fee: {formatPrice(deliveryResult.fee)} · Min order: {formatPrice(deliveryResult.minOrder)}
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* ── OPEN STATUS ──────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-4">
        <div className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-sm font-bold ${
          open ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
        }`}>
          <span className={`w-2 h-2 rounded-full ${open ? 'bg-green-500 pulse-dot' : 'bg-gray-400'}`} />
          {open ? `We're Open Now · Today: ${todayHours}` : `We're Closed · Today: ${todayHours}`}
        </div>
      </section>

      {/* ── CATEGORIES ──────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-14">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900">Browse Menu</h2>
            <p className="text-gray-500 text-sm mt-1">Find what you&apos;re craving</p>
          </div>
          <Link href="/menu" className="text-[#E53935] font-bold text-sm hover:underline flex items-center gap-1">
            View All <ChevronRight size={14} />
          </Link>
        </div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3"
        >
          {categories.filter((c) => c.visible).slice(0, 6).map((cat) => (
            <motion.div key={cat.id} variants={fadeUp}>
              <Link
                href={`/menu?category=${cat.slug}`}
                className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border-2 border-gray-100 hover:border-[#FFD700] hover:shadow-lg hover:shadow-yellow-100 transition-all duration-200 group card-hover"
              >
                <span className="text-3xl group-hover:scale-110 transition-transform duration-200">{cat.icon}</span>
                <span className="text-xs font-bold text-gray-700 text-center leading-tight">{cat.name}</span>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── POPULAR PRODUCTS ────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900">Most Popular</h2>
            <p className="text-gray-500 text-sm mt-1">Our customers can&apos;t get enough of these</p>
          </div>
          <Link href="/menu" className="text-[#E53935] font-bold text-sm hover:underline flex items-center gap-1">
            See All <ChevronRight size={14} />
          </Link>
        </div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          {popularProducts.slice(0, 8).map((product) => (
            <motion.div
              key={product.id}
              variants={fadeUp}
              onClick={() => setSelectedProduct(product)}
              className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden cursor-pointer card-hover group"
            >
              <div className="relative aspect-square overflow-hidden bg-gray-100">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-400"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
                <div className="absolute top-2 left-2 bg-[#FFD700] text-[#111] text-[10px] font-black px-2 py-0.5 rounded-full">
                  Popular
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-black text-gray-900 text-sm mb-2 line-clamp-1">{product.name}</h3>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-black text-gray-900 text-sm">
                    {product.modifiers.length ? `From ${formatPrice(product.price)}` : formatPrice(product.price)}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedProduct(product) }}
                    className="btn-brand px-3 py-1.5 rounded-lg text-xs shrink-0"
                  >
                    Add
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── OFFERS ──────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900">Special Offers</h2>
            <p className="text-gray-500 text-sm mt-1">Save more with our exclusive deals</p>
          </div>
          <Link href="/offers" className="text-[#E53935] font-bold text-sm hover:underline flex items-center gap-1">
            All Offers <ChevronRight size={14} />
          </Link>
        </div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          {activeCoupons.map((coupon) => (
            <motion.div
              key={coupon.code}
              variants={fadeUp}
              className="relative bg-[#111] text-white p-6 rounded-2xl overflow-hidden border border-white/8 hover:-translate-y-1 transition-transform duration-200"
            >
              {/* Decorative circles */}
              <div className="absolute right-0 top-0 w-28 h-28 bg-[#FFD700]/8 rounded-full -mr-10 -mt-10" />
              <div className="absolute right-8 bottom-0 w-20 h-20 bg-[#FFD700]/5 rounded-full -mb-10" />
              <div className="relative">
                <div className="text-3xl font-black text-[#FFD700] mb-2">
                  {coupon.type === 'percentage' && `${coupon.value}% OFF`}
                  {coupon.type === 'fixed'       && `£${coupon.value} OFF`}
                  {coupon.type === 'freeDelivery' && 'FREE DELIVERY'}
                </div>
                <p className="text-gray-400 text-sm mb-4">{coupon.description}</p>
                <div className="inline-flex items-center gap-2 bg-[#FFD700]/15 border border-[#FFD700]/30 rounded-lg px-3 py-1.5">
                  <span className="text-xs text-gray-400">Code:</span>
                  <span className="font-black text-[#FFD700] tracking-wider">{coupon.code}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── WHY US ──────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900">Why Choose Pizza Guys?</h2>
        </div>
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[
            { icon: <Zap size={26} className="text-[#FFD700]" />, bg: 'bg-yellow-50',  title: 'Lightning Fast',    desc: '30–45 min average delivery' },
            { icon: <Star size={26} className="text-[#E53935]" fill="#E53935" />, bg: 'bg-red-50',    title: 'Top Rated',        desc: '4.8★ from 2,000+ reviews'  },
            { icon: <Heart size={26} className="text-pink-500" />,                bg: 'bg-pink-50',   title: 'Fresh Every Day',  desc: 'Made fresh to order'        },
            { icon: <Award size={26} className="text-[#27AE60]" />,               bg: 'bg-green-50',  title: 'Since 2009',       desc: 'Trusted by local families'  },
          ].map((item) => (
            <motion.div
              key={item.title}
              variants={fadeUp}
              className="bg-white rounded-2xl p-5 sm:p-6 text-center border-2 border-gray-100 hover:border-[#FFD700] hover:shadow-lg hover:shadow-yellow-100 transition-all duration-200"
            >
              <div className={`${item.bg} w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3`}>
                {item.icon}
              </div>
              <h3 className="font-black text-gray-900 mb-1 text-sm sm:text-base">{item.title}</h3>
              <p className="text-gray-500 text-xs sm:text-sm">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── OPENING HOURS ────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-16 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-[#111] text-white rounded-2xl p-6 sm:p-8 border border-white/8 overflow-hidden relative"
        >
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-[#E53935] via-[#FFD700] to-[#27AE60]" />

          <div className="flex flex-col sm:flex-row gap-8 items-start">
            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl font-black mb-2">Opening Hours</h2>
              <p className="text-gray-400 text-sm mb-4">Order online any time — we&apos;ll confirm when we&apos;re open</p>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${
                open
                  ? 'bg-green-500/15 text-green-400 border border-green-500/20'
                  : 'bg-red-500/15 text-red-400 border border-red-500/20'
              }`}>
                <span className={`w-2 h-2 rounded-full ${open ? 'bg-green-400 pulse-dot' : 'bg-red-400'}`} />
                {open ? 'Open Now' : 'Currently Closed'}
              </div>
              <div className="mt-6">
                <Link href="/menu" className="btn-brand inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm">
                  Order Now <ChevronRight size={15} />
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm w-full sm:w-auto">
              {openingHours.map((h) => (
                <div key={h.day} className="flex gap-4 items-center">
                  <span className="text-gray-500 w-10 shrink-0 text-xs">{h.day.slice(0, 3)}</span>
                  <span className="font-bold text-gray-200 text-xs">{h.closed ? 'Closed' : `${h.open}–${h.close}`}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>
    </>
  )
}
