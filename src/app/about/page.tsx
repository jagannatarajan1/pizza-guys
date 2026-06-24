'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Phone, Mail, MapPin, Clock, Heart, Zap, Star, Users, ChevronRight } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
}

const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.09 } },
}

const stats = [
  { value: '15+',    label: 'Years in Business' },
  { value: '200K+',  label: 'Meals Served'      },
  { value: '4.8★',   label: 'Average Rating'    },
  { value: '30 min', label: 'Avg Delivery'      },
]

const whyUs = [
  { icon: Heart, bg: 'bg-pink-50',   color: 'text-pink-500',     title: 'Fresh Ingredients', desc: 'We source fresh, quality ingredients daily and never compromise on flavour.'           },
  { icon: Zap,   bg: 'bg-yellow-50', color: 'text-[#FFD700]',    title: 'Fast Delivery',     desc: 'Hot food at your door in 30–45 minutes. We guarantee it arrives fresh.'             },
  { icon: Star,  bg: 'bg-red-50',    color: 'text-[#E53935]',    title: 'Quality Service',   desc: 'Our friendly team is always ready to help — before, during and after your order.'   },
  { icon: Users, bg: 'bg-green-50',  color: 'text-[#27AE60]',    title: 'Customer First',    desc: 'Over 2,000 five-star reviews from happy customers across our community.'            },
]

const hours = [
  { day: 'Monday – Thursday', h: '11:00 – 23:00' },
  { day: 'Friday – Saturday', h: '11:00 – 23:30' },
  { day: 'Sunday',            h: '12:00 – 23:00' },
]

const gallery = [
  '/images/Pizza/Meat feast.avif',
  '/images/Pizza/Pepperoni feast.avif',
  '/images/Pizza/Chicken tikka.avif',
  '/images/Burgers/Bbq smash burger.avif',
  '/images/Kebab/Chicken Kebab.avif',
  '/images/Sides/Cheesy chips.avif',
]

export default function AboutPage() {
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
            className="inline-flex items-center gap-2 bg-[#FFD700]/15 border border-[#FFD700]/30 text-[#FFD700] text-xs font-bold px-4 py-2 rounded-full mb-5"
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
            <p className="text-gray-500 leading-relaxed mb-4">
              Pizza Guys was founded in 2009 with a simple mission: to serve the best handmade pizzas, burgers, and kebabs to the families of Staines and surrounding areas. What started as a small local takeaway has grown into a much-loved institution in our community.
            </p>
            <p className="text-gray-500 leading-relaxed mb-4">
              We believe that great food starts with great ingredients. That&apos;s why we source fresh produce daily, make our dough in-house every morning, and use authentic recipes refined over 15+ years.
            </p>
            <p className="text-gray-500 leading-relaxed mb-6">
              Today, we&apos;re proud to have served over 200,000 meals and counting. From birthday parties to weeknight dinners, Pizza Guys has been part of thousands of family moments across Surrey and Middlesex.
            </p>
            <Link href="/menu" className="btn-brand inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm">
              Order Now <ChevronRight size={14} />
            </Link>
          </motion.div>

          {/* Stats grid */}
          <motion.div variants={fadeUp} className="relative bg-[#111] rounded-2xl p-8 overflow-hidden border border-white/8">
            <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-[#E53935] via-[#FFD700] to-[#27AE60]" />
            <div className="grid grid-cols-2 gap-6 text-center">
              {stats.map((s) => (
                <div key={s.label} className="py-2">
                  <div className="text-3xl font-black text-[#FFD700] mb-1">{s.value}</div>
                  <div className="text-gray-400 text-sm">{s.label}</div>
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
                className="bg-white rounded-2xl p-5 border-2 border-gray-100 text-center hover:border-[#FFD700] hover:shadow-lg hover:shadow-yellow-100 transition-all duration-200"
              >
                <div className={`w-12 h-12 ${item.bg} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                  <item.icon className={item.color} size={22} />
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
                className="aspect-square rounded-2xl overflow-hidden bg-gray-100 card-hover"
              >
                <img src={src} alt="Food" className="w-full h-full object-cover" />
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
          <motion.div variants={fadeUp} className="relative bg-[#111] text-white rounded-2xl p-6 overflow-hidden border border-white/8">
            <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-[#E53935] via-[#FFD700] to-[#27AE60]" />
            <h3 className="font-black text-base mb-4 flex items-center gap-2">
              <Clock size={16} className="text-[#FFD700]" /> Opening Hours
            </h3>
            <div className="space-y-2.5 text-sm">
              {hours.map((h) => (
                <div key={h.day} className="flex justify-between">
                  <span className="text-gray-400">{h.day}</span>
                  <span className="font-bold text-white">{h.h}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Contact */}
          <motion.div variants={fadeUp} className="bg-white rounded-2xl p-6 border-2 border-gray-100">
            <h3 className="font-black text-gray-900 text-base mb-4">Contact Us</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center shrink-0"><MapPin size={14} className="text-[#E53935]" /></div>
                <span className="text-gray-500 leading-snug">209 Laleham Road, Staines-upon-Thames, Surrey, TW18 2EA</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center shrink-0"><Phone size={14} className="text-[#FFD700]" /></div>
                <a href="tel:01784452888" className="text-gray-500 hover:text-[#E53935] font-semibold transition-colors">01784 452 888</a>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center shrink-0"><Mail size={14} className="text-[#27AE60]" /></div>
                <a href="mailto:info@pizzaguys.co.uk" className="text-gray-500 hover:text-[#E53935] font-semibold transition-colors">info@pizzaguys.co.uk</a>
              </div>
            </div>
          </motion.div>
        </motion.section>

        {/* ── Map placeholder ───────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-gray-100 rounded-2xl h-64 flex items-center justify-center border-2 border-gray-100"
        >
          <div className="text-center text-gray-400">
            <MapPin size={32} className="mx-auto mb-2 text-[#E53935]" />
            <p className="font-semibold text-sm">209 Laleham Road, Staines-upon-Thames</p>
            <p className="text-xs mt-1">Surrey, TW18 2EA</p>
          </div>
        </motion.div>

      </div>
    </div>
  )
}
