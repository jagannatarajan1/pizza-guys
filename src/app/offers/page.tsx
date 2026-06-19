'use client'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Tag, Clock, ChevronRight, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { activeCoupons, products } from '@/lib/menu-data'
import { formatPrice } from '@/lib/utils'

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
}

const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.08 } },
}

function CouponCard({ coupon }: { coupon: typeof activeCoupons[0] }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(coupon.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      variants={fadeUp}
      className="relative bg-[#111] text-white rounded-2xl p-6 overflow-hidden border border-white/8 hover:-translate-y-1 transition-transform duration-200"
    >
      {/* Decorative circles */}
      <div className="absolute right-0 top-0 w-32 h-32 bg-[#FFD700]/8 rounded-full -mr-12 -mt-12" />
      <div className="absolute right-8 bottom-0 w-20 h-20 bg-[#FFD700]/5 rounded-full -mb-10" />

      <div className="relative">
        <div className="text-3xl font-black text-[#FFD700] mb-2">
          {coupon.type === 'percentage'  && `${coupon.value}% OFF`}
          {coupon.type === 'fixed'       && `£${coupon.value} OFF`}
          {coupon.type === 'freeDelivery' && 'FREE DELIVERY'}
        </div>
        <p className="text-gray-400 text-sm mb-1">{coupon.description}</p>
        <p className="text-gray-600 text-xs mb-4">Min. order: {formatPrice(coupon.minOrder)}</p>

        {/* Code + copy */}
        <div className="flex items-center gap-2 bg-[#FFD700]/10 border border-[#FFD700]/25 rounded-xl px-4 py-2.5 mb-4">
          <span className="text-xs text-gray-500 shrink-0">Code:</span>
          <span className="font-black text-[#FFD700] tracking-widest flex-1">{coupon.code}</span>
          <button onClick={copy} className="text-gray-500 hover:text-[#FFD700] transition-colors shrink-0">
            {copied ? <Check size={14} className="text-[#27AE60]" /> : <Copy size={14} />}
          </button>
        </div>

        <Link
          href="/menu"
          className="btn-brand block w-full py-2.5 rounded-xl text-sm text-center"
        >
          Order & Use Code
        </Link>
      </div>
    </motion.div>
  )
}

export default function OffersPage() {
  const deals = products.filter((p) =>
    ['pizza-deals', 'pizza-meal', 'lunch-offers'].includes(p.category)
  )

  return (
    <div>
      {/* ── Hero ─────────────────────────────────── */}
      <section className="relative bg-[#111] text-white overflow-hidden py-20 px-4 sm:px-6 text-center">
        <div className="absolute inset-0 bg-linear-to-br from-[#E53935]/20 via-[#111] to-[#FFD700]/10" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-[#E53935] via-[#FFD700] to-[#27AE60]" />
        <div className="relative max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-[#FFD700]/15 border border-[#FFD700]/30 text-[#FFD700] text-xs font-bold px-4 py-2 rounded-full mb-5"
          >
            🏷️ Exclusive Deals
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="text-4xl sm:text-5xl font-black mb-3 leading-tight"
          >
            Special <span className="text-[#FFD700]">Offers</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="text-gray-400 max-w-lg mx-auto text-base"
          >
            Save big with our exclusive discount codes and limited-time promotions
          </motion.p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 space-y-16">

        {/* ── Coupon Codes ────────────────────────── */}
        <section>
          <div className="flex items-center gap-2.5 mb-7">
            <div className="w-9 h-9 bg-yellow-50 rounded-xl flex items-center justify-center">
              <Tag size={17} className="text-[#FFD700]" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900">Coupon Codes</h2>
              <p className="text-gray-500 text-sm">Apply at checkout to save instantly</p>
            </div>
          </div>

          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="grid sm:grid-cols-3 gap-4"
          >
            {activeCoupons.map((coupon) => (
              <CouponCard key={coupon.code} coupon={coupon} />
            ))}
          </motion.div>
        </section>

        {/* ── Deal Bundles ─────────────────────────── */}
        {deals.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-7">
              <div>
                <h2 className="text-2xl font-black text-gray-900">Crazy Deals &amp; Bundles</h2>
                <p className="text-gray-500 text-sm mt-0.5">The best value on the menu</p>
              </div>
              <Link href="/menu" className="text-[#E53935] font-bold text-sm hover:underline flex items-center gap-1">
                Full Menu <ChevronRight size={14} />
              </Link>
            </div>

            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-60px' }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {deals.map((product) => (
                <motion.div
                  key={product.id}
                  variants={fadeUp}
                  className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden card-hover group"
                >
                  <div className="relative aspect-4/3 overflow-hidden bg-gray-100">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 100vw, 33vw"
                    />
                    <div className="absolute top-2 right-2 bg-[#FFD700] text-[#111] text-[10px] font-black px-2.5 py-0.5 rounded-full">
                      DEAL
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-black text-gray-900 mb-1">{product.name}</h3>
                    <p className="text-gray-500 text-sm mb-3 line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-black text-gray-900 text-lg">{formatPrice(product.price)}</span>
                      <Link href="/menu" className="btn-brand px-4 py-2 rounded-lg text-sm">
                        Order
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </section>
        )}

        {/* ── Lunch Offers ─────────────────────────── */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative bg-[#111] text-white rounded-2xl p-7 sm:p-9 overflow-hidden border border-white/8"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-[#E53935] via-[#FFD700] to-[#27AE60]" />
            <div className="absolute right-0 bottom-0 text-[8rem] leading-none opacity-10 select-none pr-4 pb-2">🌮</div>

            <div className="relative flex flex-col sm:flex-row gap-6 items-start">
              <div className="w-12 h-12 bg-[#FFD700]/15 rounded-xl flex items-center justify-center shrink-0">
                <Clock size={22} className="text-[#FFD700]" />
              </div>
              <div className="flex-1">
                <h2 className="font-black text-white text-xl mb-1">Lunch Time Offers</h2>
                <p className="text-[#FFD700] text-sm font-bold mb-3">Monday – Friday · 11:00am – 4:00pm only</p>
                <p className="text-gray-400 text-sm mb-5 max-w-lg leading-relaxed">
                  Beat the lunch rush with our specially priced lunch deals. Every meal includes a main, fries, and a regular drink at an unbeatable price.
                </p>
                <Link
                  href="/menu?category=lunch-offers"
                  className="btn-brand inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm"
                >
                  View Lunch Menu <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </motion.div>
        </section>

      </div>
    </div>
  )
}
