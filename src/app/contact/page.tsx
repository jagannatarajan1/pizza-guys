'use client'
import { useState } from 'react'
import { Phone, Mail, MapPin, Clock, Send } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) { toast.error('Please fill all required fields'); return }
    setSending(true)
    await new Promise((r) => setTimeout(r, 1000))
    setSending(false)
    setForm({ name: '', email: '', phone: '', message: '' })
    toast.success('Message sent! We\'ll get back to you soon.')
  }

  return (
    <div>
      <div className="bg-gray-900 text-white py-16 px-4 sm:px-6 text-center">
        <h1 className="text-4xl font-black mb-3">Get in Touch</h1>
        <p className="text-gray-400">We&apos;d love to hear from you. Send us a message or give us a call!</p>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-10">
          {/* Contact form */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-black text-gray-900 text-xl mb-5">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { key: 'name', label: 'Your Name *', type: 'text', placeholder: 'John Smith' },
                { key: 'email', label: 'Email Address *', type: 'email', placeholder: 'john@example.com' },
                { key: 'phone', label: 'Phone Number', type: 'tel', placeholder: '07700900000' },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">{f.label}</label>
                  <input
                    type={f.type}
                    value={form[f.key as keyof typeof form]}
                    onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Message *</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                  placeholder="How can we help you?"
                  rows={5}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400 resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={sending}
                className={`w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-colors ${sending ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700'}`}
              >
                <Send size={16} /> {sending ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>

          {/* Info */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                    <MapPin size={16} className="text-red-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">Address</div>
                    <div className="text-gray-600 text-sm">209 Laleham Road<br />Staines-upon-Thames<br />Surrey, TW18 2EA</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                    <Phone size={16} className="text-red-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">Phone</div>
                    <a href="tel:01784452888" className="text-gray-600 text-sm hover:text-red-600">01784 452 888</a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                    <Mail size={16} className="text-red-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">Email</div>
                    <a href="mailto:info@pizzaguys.co.uk" className="text-gray-600 text-sm hover:text-red-600">info@pizzaguys.co.uk</a>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 text-white rounded-2xl p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2"><Clock size={16} className="text-red-400" /> Opening Hours</h3>
              <div className="space-y-2 text-sm">
                {[
                  { d: 'Monday – Thursday', h: '11:00 – 23:00' },
                  { d: 'Friday – Saturday', h: '11:00 – 23:30' },
                  { d: 'Sunday', h: '12:00 – 23:00' },
                ].map((row) => (
                  <div key={row.d} className="flex justify-between">
                    <span className="text-gray-400">{row.d}</span>
                    <span className="font-medium">{row.h}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Map placeholder */}
            <div className="bg-gray-100 rounded-2xl h-48 flex items-center justify-center text-gray-400 text-sm">
              <div className="text-center">
                <MapPin size={28} className="mx-auto mb-2" />
                <p>209 Laleham Road, Staines-upon-Thames</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
