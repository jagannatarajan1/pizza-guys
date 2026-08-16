'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Phone, Mail, MapPin, Clock, Heart, Zap, Star, Users, ChevronRight } from 'lucide-react'
import type { Product } from '@/lib/types'
import { useSiteConfig } from '@/context/SiteConfigContext'
import { mapEmbedSrc } from '@/lib/utils'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
}

const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.09 } },
}

const whyUs = [
  { icon: Heart, bg: 'bg-pink-50',   color: 'text-pink-500',  title: 'Fresh Ingredients', desc: 'We source fresh, quality ingredients daily and never compromise on flavour.'         },
  { icon: Zap,   bg: 'bg-yellow-50', color: '',               title: 'Fast Delivery',     desc: 'Hot food at your door in 30–45 minutes. We guarantee it arrives fresh.'           },
  { icon: Star,  bg: 'bg-red-50',    color: '',               title: 'Quality Service',   desc: 'Our friendly team is always ready to help — before, during and after your order.' },
  { icon: Users, bg: 'bg-green-50',  color: '',               title: 'Customer First',    desc: 'Over 2,000 five-star reviews from happy customers across our community.'          },
]

export default function AboutPage() {
  const cfg = useSiteConfig()
  const [gallery, setGallery] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/menu/products')
      .then((r) => r.json())
      .then((data) => {
        const imgs = (data.products ?? [] as Product[])
          .filter((p: Product) => p.popular && p.image)
          .slice(0, 6)
          .map((p: Product) => p.image)
        setGallery(imgs)
      })
  }, [])
  return (
    <div>
      {/* ── Hero ─────────────────────────────────── */}
      <section className="relative bg-[#111] text-white overflow-hidden py-20 px-4 sm:px-6 text-center">
        <div className="absolute inset-0 bg-linear-to-br from-[#E53935]/15 via-[#111] to-[#FFD700]/10" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-[#E53935] via-[#FFD700] to-[#27AE60]" />
        <div className="relative max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full mb-5"
            style={{ background: 'color-mix(in srgb,var(--brand-accent) 15%,transparent)', border: '1px solid color-mix(in srgb,var(--brand-accent) 30%,transparent)', color: 'var(--brand-accent)' }}
          >
            ❤️ Family-Run Since 2009
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="text-4xl sm:text-5xl font-black mb-3"
          >
            Our <span className="text-[#FFD700]">Story</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="text-gray-400 text-base max-w-lg mx-auto"
          >
            A family business with a passion for great food and even better service
          </motion.p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14 space-y-20">

        {/* ── Story + Stats ────────────────────────── */}
        <motion.section
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid lg:grid-cols-2 gap-12 items-center"
        >
          <motion.div variants={fadeUp}>
            <h2 className="text-3xl font-black text-gray-900 mb-5">From Our Family to Yours</h2>
            {cfg.about_story.split('\n\n').map((para, i) => (
              <p key={i} className="text-gray-500 leading-relaxed mb-4">{para}</p>
            ))}
            <Link href="/menu" className="btn-brand inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm">
              Order Now <ChevronRight size={14} />
            </Link>
          </motion.div>

          {/* Stats grid */}
          <motion.div variants={fadeUp} className="relative rounded-2xl p-8 overflow-hidden border border-white/8" style={{ background: 'var(--brand-dark)' }}>
            <div className="absolute top-0 left-0 right-0 h-1" style={{ background: `linear-gradient(to right, var(--brand-primary), var(--brand-accent), var(--brand-success))` }} />
            <div className="grid grid-cols-2 gap-6 text-center">
              {[
                { val: cfg.about_stat1_val, lbl: cfg.about_stat1_lbl },
                { val: cfg.about_stat2_val, lbl: cfg.about_stat2_lbl },
                { val: cfg.about_stat3_val, lbl: cfg.about_stat3_lbl },
                { val: cfg.about_stat4_val, lbl: cfg.about_stat4_lbl },
              ].map((s) => (
                <div key={s.lbl} className="py-2">
                  <div className="text-3xl font-black mb-1" style={{ color: 'var(--brand-accent)' }}>{s.val}</div>
                  <div className="text-gray-400 text-sm">{s.lbl}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.section>

        {/* ── Why Us ───────────────────────────────── */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-gray-900 mb-2">Why Choose Us?</h2>
            <p className="text-gray-500">Quality you can taste in every bite</p>
          </div>
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {whyUs.map((item) => (
              <motion.div
                key={item.title}
                variants={fadeUp}
                className="bg-white rounded-2xl p-5 border-2 border-gray-100 text-center card-hover transition-all duration-200"
              >
                <div className={`w-12 h-12 ${item.bg} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                  <item.icon
                    size={22}
                    className={item.color || undefined}
                    style={!item.color ? { color: 'var(--brand-accent)' } : undefined}
                  />
                </div>
                <h3 className="font-black text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ── Gallery ──────────────────────────────── */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-gray-900 mb-2">Our Kitchen</h2>
            <p className="text-gray-500">Fresh food, made with love</p>
          </div>
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-2 sm:grid-cols-3 gap-3"
          >
            {gallery.map((src, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 card-hover"
              >
                <Image src={src} alt="Food" fill className="object-cover" />
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ── Hours + Contact ───────────────────────── */}
        <motion.section
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="grid sm:grid-cols-2 gap-6"
        >
          {/* Hours */}
          <motion.div variants={fadeUp} className="relative text-white rounded-2xl p-6 overflow-hidden border border-white/8" style={{ background: 'var(--brand-dark)' }}>
            <div className="absolute top-0 left-0 right-0 h-1" style={{ background: `linear-gradient(to right, var(--brand-primary), var(--brand-accent), var(--brand-success))` }} />
            <h3 className="font-black text-base mb-4 flex items-center gap-2">
              <Clock size={16} style={{ color: 'var(--brand-accent)' }} /> Opening Hours
            </h3>
            <div className="space-y-2.5 text-sm">
              {[
                { day: 'Monday – Thursday', h: cfg.hours_mon_thu },
                { day: 'Friday – Saturday', h: cfg.hours_fri_sat },
                { day: 'Sunday',            h: cfg.hours_sun },
              ].map((row) => (
                <div key={row.day} className="flex justify-between">
                  <span className="text-gray-400">{row.day}</span>
                  <span className="font-bold text-white">{row.h}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Contact */}
          <motion.div variants={fadeUp} className="bg-white rounded-2xl p-6 border-2 border-gray-100">
            <h3 className="font-black text-gray-900 text-base mb-4">Contact Us</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center shrink-0"><MapPin size={14} style={{ color: 'var(--brand-primary)' }} /></div>
                <span className="text-gray-500 leading-snug">{cfg.biz_address}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center shrink-0"><Phone size={14} style={{ color: 'var(--brand-accent)' }} /></div>
                <a href={`tel:${cfg.biz_phone.replace(/\s/g, '')}`} className="text-gray-500 hover:text-(--brand-primary) font-semibold transition-colors">{cfg.biz_phone}</a>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center shrink-0"><Mail size={14} style={{ color: 'var(--brand-success)' }} /></div>
                <a href={`mailto:${cfg.biz_email}`} className="text-gray-500 hover:text-(--brand-primary) font-semibold transition-colors">{cfg.biz_email}</a>
              </div>
            </div>
          </motion.div>
        </motion.section>

        {/* ── Map ──────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border-2 border-gray-100 overflow-hidden"
        >
          <div className="h-56">
            <iframe
              src={mapEmbedSrc(cfg.biz_map_lat, cfg.biz_map_lng, cfg.google_maps_api_key, cfg.biz_map_embed_url)}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Pizza Guys location"
            />
          </div>
          <a
            href={cfg.biz_map_link || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cfg.biz_address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 bg-gray-50 hover:bg-gray-100 text-sm font-bold py-2.5 transition-colors text-[#E53935]"
          >
            <MapPin size={14} /> Get Directions
          </a>
        </motion.div>

      </div>
    </div>
  )
}
