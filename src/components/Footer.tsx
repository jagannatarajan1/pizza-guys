'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Phone, Mail, MapPin, Clock, Send } from 'lucide-react'
import BrandLogo from '@/components/BrandLogo'
import { useSiteConfig } from '@/context/SiteConfigContext'

const quickLinks = [
  { href: '/',        label: 'Home' },
  { href: '/menu',    label: 'Menu' },
  { href: '/offers',  label: 'Special Offers' },
  { href: '/about',   label: 'About Us' },
  { href: '/contact', label: 'Contact Us' },
]

const infoLinks = [
  { href: '/terms',     label: 'Terms & Conditions' },
  { href: '/privacy',   label: 'Privacy Policy' },
  { href: '/cookie-policy', label: 'Cookie Policy' },
  { href: '/refund-policy', label: 'Refund Policy' },
  { href: '/allergens', label: 'Allergy Information' },
  { href: '/dashboard', label: 'My Account' },
]

export default function Footer() {
  const cfg = useSiteConfig()
  const [email, setEmail]       = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const socials = [
    { label: 'f',   title: 'Facebook',   href: cfg.social_facebook  },
    { label: 'ig',  title: 'Instagram',  href: cfg.social_instagram },
    { label: '𝕏',   title: 'X/Twitter', href: cfg.social_twitter   },
    { label: 'tt',  title: 'TikTok',     href: cfg.social_tiktok    },
  ].filter((s) => s.href)

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setSubscribed(true)
    setEmail('')
  }

  return (
    <footer className="text-gray-400 mt-20" style={{ background: 'var(--brand-dark)' }}>
      {/* Top colour bar */}
      <div className="h-1" style={{ background: `linear-gradient(to right, var(--brand-primary), var(--brand-accent), var(--brand-success))` }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand + Newsletter */}
          <div>
            <div className="mb-5">
              <BrandLogo size="md" />
            </div>
            <p className="text-sm text-gray-500 leading-relaxed mb-5">
              {cfg.biz_tagline}
            </p>

            {/* Social icons */}
            {socials.length > 0 && (
              <div className="flex gap-2 mb-6">
                {socials.map((s) => (
                  <a
                    key={s.title}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={s.title}
                    className="w-9 h-9 bg-white/6 text-gray-400 rounded-xl flex items-center justify-center transition-all duration-150 text-xs font-black hover:text-(--brand-dark)"
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--brand-accent)' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}
                  >
                    {s.label}
                  </a>
                ))}
              </div>
            )}

            {/* Newsletter */}
            <div>
              <p className="text-xs font-black text-white uppercase tracking-widest mb-2">Newsletter</p>
              {subscribed ? (
                <p className="text-xs text-green-400 font-bold">Thank you for subscribing! 🎉</p>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-1.5">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email"
                    required
                    className="flex-1 min-w-0 bg-white/8 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-colors"
                  />
                  <button
                    type="submit"
                    className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
                    style={{ background: 'var(--brand-accent)', color: 'var(--brand-dark)' }}
                    aria-label="Subscribe"
                  >
                    <Send size={13} />
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="font-black text-white mb-4 text-sm uppercase tracking-widest">Quick Links</h3>
            <ul className="space-y-2.5 text-sm">
              {quickLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-(--brand-accent) transition-colors flex items-center gap-2 group">
                    <span className="w-1 h-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'var(--brand-accent)' }} />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info links */}
          <div>
            <h3 className="font-black text-white mb-4 text-sm uppercase tracking-widest">Information</h3>
            <ul className="space-y-2.5 text-sm">
              {infoLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-(--brand-accent) transition-colors flex items-center gap-2 group">
                    <span className="w-1 h-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'var(--brand-accent)' }} />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact + hours */}
          <div>
            <h3 className="font-black text-white mb-4 text-sm uppercase tracking-widest">Get In Touch</h3>
            <ul className="space-y-3 text-sm mb-5">
              <li className="flex items-start gap-3">
                <MapPin size={15} className="shrink-0 mt-0.5" style={{ color: 'var(--brand-accent)' }} />
                <span className="leading-snug">{cfg.biz_address}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={15} className="shrink-0" style={{ color: 'var(--brand-accent)' }} />
                <div className="flex flex-col gap-0.5">
                  <a href={`tel:${cfg.biz_phone.replace(/\s/g, '')}`} className="hover:text-(--brand-accent) transition-colors">{cfg.biz_phone}</a>
                  {cfg.biz_phone2 && (
                    <a href={`tel:${cfg.biz_phone2.replace(/\s/g, '')}`} className="hover:text-(--brand-accent) transition-colors">{cfg.biz_phone2}</a>
                  )}
                </div>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={15} className="shrink-0" style={{ color: 'var(--brand-accent)' }} />
                <a href={`mailto:${cfg.biz_email}`} className="hover:text-(--brand-accent) transition-colors">{cfg.biz_email}</a>
              </li>
            </ul>

            <div className="bg-white/5 rounded-xl p-4 text-xs border border-white/8">
              <div className="flex items-center gap-2 font-black text-white mb-2">
                <Clock size={13} style={{ color: 'var(--brand-accent)' }} /> Opening Hours
              </div>
              <div className="space-y-1 text-gray-400">
                {[
                  { label: 'Mon', key: 'mon' },
                  { label: 'Tue', key: 'tue' },
                  { label: 'Wed', key: 'wed' },
                  { label: 'Thu', key: 'thu' },
                  { label: 'Fri', key: 'fri' },
                  { label: 'Sat', key: 'sat' },
                  { label: 'Sun', key: 'sun' },
                ].map(({ label, key }) => {
                  const closed = cfg[`hours_${key}_closed`] === 'true'
                  const open   = cfg[`hours_${key}_open`]  || '11:00'
                  const close  = cfg[`hours_${key}_close`] || '23:00'
                  return (
                    <div key={key} className="flex justify-between">
                      <span>{label}</span>
                      <span className={closed ? 'text-gray-600' : 'text-white font-bold'}>
                        {closed ? 'Closed' : `${open} – ${close}`}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Map placeholder — drop a real Google Maps <iframe> in here once the business owner supplies the embed link */}
            <div className="mt-5 h-50 w-full rounded-xl border border-white/8 bg-white/5 flex items-center justify-center text-center px-4">
              {/* MAP_EMBED_PLACEHOLDER: replace this div's contents with <iframe src="..." width="100%" height="100%" style={{ border: 0 }} loading="lazy" /> */}
              <div className="flex flex-col items-center gap-1.5 text-gray-500">
                <MapPin size={18} style={{ color: 'var(--brand-accent)' }} />
                <span className="text-xs font-bold">Map coming soon</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/8 mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-600">
          <p>© {new Date().getFullYear()} {cfg.biz_name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
