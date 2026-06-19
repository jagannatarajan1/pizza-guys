'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Phone, Mail, MapPin, Clock, Send } from 'lucide-react'
import toast from 'react-hot-toast'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
}

const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.08 } },
}

const hours = [
  { d: 'Monday – Thursday', h: '11:00 – 23:00' },
  { d: 'Friday – Saturday', h: '11:00 – 23:30' },
  { d: 'Sunday',            h: '12:00 – 23:00' },
]

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) {
      toast.error('Please fill all required fields')
      return
    }
    setSending(true)
    await new Promise((r) => setTimeout(r, 1000))
    setSending(false)
    setForm({ name: '', email: '', phone: '', message: '' })
    toast.success("Message sent! We'll get back to you soon.")
  }

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
            📞 We&apos;d Love to Hear From You
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="text-4xl sm:text-5xl font-black mb-3"
          >
            Get in <span className="text-[#FFD700]">Touch</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="text-gray-400 text-base"
          >
            Send us a message, give us a call, or pop in to see us
          </motion.p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid lg:grid-cols-2 gap-8"
        >
          {/* ── Contact Form ────────────────────────── */}
          <motion.div variants={fadeUp} className="bg-white rounded-2xl border-2 border-gray-100 p-6 sm:p-8">
            <h2 className="font-black text-gray-900 text-xl mb-6">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { key: 'name',  label: 'Your Name *',      type: 'text',  placeholder: 'John Smith' },
                { key: 'email', label: 'Email Address *',  type: 'email', placeholder: 'john@example.com' },
                { key: 'phone', label: 'Phone Number',     type: 'tel',   placeholder: '07700 900000' },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">{f.label}</label>
                  <input
                    type={f.type}
                    value={form[f.key as keyof typeof form]}
                    onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-[#FFD700] transition-colors"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Message *</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                  placeholder="How can we help you?"
                  rows={5}
                  className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-[#FFD700] transition-colors resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={sending}
                className={`w-full py-3 rounded-xl font-black flex items-center justify-center gap-2 transition-all duration-150 ${
                  sending
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'btn-brand'
                }`}
              >
                {sending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-gray-600 rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <><Send size={15} /> Send Message</>
                )}
              </button>
            </form>
          </motion.div>

          {/* ── Info Column ─────────────────────────── */}
          <div className="space-y-5">
            {/* Contact info */}
            <motion.div variants={fadeUp} className="bg-white rounded-2xl border-2 border-gray-100 p-6">
              <h3 className="font-black text-gray-900 mb-5">Contact Information</h3>
              <div className="space-y-4">
                {[
                  {
                    icon: <MapPin size={16} className="text-[#E53935]" />,
                    bg: 'bg-red-50',
                    label: 'Address',
                    content: (
                      <span className="text-gray-500 text-sm leading-snug">
                        209 Laleham Road<br />Staines-upon-Thames<br />Surrey, TW18 2EA
                      </span>
                    ),
                  },
                  {
                    icon: <Phone size={16} className="text-[#FFD700]" />,
                    bg: 'bg-yellow-50',
                    label: 'Phone',
                    content: (
                      <a href="tel:01784452888" className="text-gray-500 text-sm hover:text-[#E53935] transition-colors font-semibold">
                        01784 452 888
                      </a>
                    ),
                  },
                  {
                    icon: <Mail size={16} className="text-[#27AE60]" />,
                    bg: 'bg-green-50',
                    label: 'Email',
                    content: (
                      <a href="mailto:info@pizzaguys.co.uk" className="text-gray-500 text-sm hover:text-[#E53935] transition-colors font-semibold">
                        info@pizzaguys.co.uk
                      </a>
                    ),
                  },
                ].map((row) => (
                  <div key={row.label} className="flex items-start gap-3">
                    <div className={`w-9 h-9 ${row.bg} rounded-xl flex items-center justify-center shrink-0`}>
                      {row.icon}
                    </div>
                    <div>
                      <div className="font-black text-gray-900 text-xs mb-0.5">{row.label}</div>
                      {row.content}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Opening hours */}
            <motion.div variants={fadeUp} className="relative bg-[#111] text-white rounded-2xl p-6 overflow-hidden border border-white/8">
              <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-[#E53935] via-[#FFD700] to-[#27AE60]" />
              <h3 className="font-black mb-4 flex items-center gap-2 text-base">
                <Clock size={16} className="text-[#FFD700]" /> Opening Hours
              </h3>
              <div className="space-y-2.5 text-sm">
                {hours.map((row) => (
                  <div key={row.d} className="flex justify-between items-center">
                    <span className="text-gray-400">{row.d}</span>
                    <span className="font-bold text-white">{row.h}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Map placeholder */}
            <motion.div variants={fadeUp} className="bg-gray-100 rounded-2xl h-44 flex items-center justify-center border-2 border-gray-100 overflow-hidden">
              <div className="text-center text-gray-400">
                <MapPin size={28} className="mx-auto mb-2 text-[#E53935]" />
                <p className="text-sm font-semibold">209 Laleham Road, Staines-upon-Thames</p>
                <p className="text-xs mt-1 text-gray-400">Surrey, TW18 2EA</p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
