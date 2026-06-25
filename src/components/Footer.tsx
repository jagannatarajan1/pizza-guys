'use client'
import Link from 'next/link'
import { Phone, Mail, MapPin, Clock } from 'lucide-react'
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
  { href: '/allergens', label: 'Allergy Information' },
  { href: '/dashboard', label: 'My Account' },
]

export default function Footer() {
  const cfg = useSiteConfig()

  const socials = [
    { label: 'f',  title: 'Facebook',   href: cfg.social_facebook  },
    { label: 'ig', title: 'Instagram',  href: cfg.social_instagram },
    { label: '𝕏',  title: 'X/Twitter', href: cfg.social_twitter   },
  ].filter((s) => s.href)

  return (
    <footer className="text-gray-400 mt-20" style={{ background: 'var(--brand-dark)' }}>
      {/* Top colour bar */}
      <div className="h-1" style={{ background: `linear-gradient(to right, var(--brand-primary), var(--brand-accent), var(--brand-success))` }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand */}
          <div>
            <div className="mb-5">
              <BrandLogo size="md" />
            </div>
            <p className="text-sm text-gray-500 leading-relaxed mb-5">
              {cfg.biz_tagline}
            </p>
            {socials.length > 0 && (
              <div className="flex gap-2">
                {socials.map((s) => (
                  <a
                    key={s.title}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={s.title}
                    className="w-9 h-9 bg-white/6 text-gray-400 rounded-xl flex items-center justify-center transition-all duration-150 text-xs font-black hover:text-(--brand-dark)"
                    style={{ ['--hover-bg' as string]: 'var(--brand-accent)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--brand-accent)' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}
                  >
                    {s.label}
                  </a>
                ))}
              </div>
            )}
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
                <a href={`tel:${cfg.biz_phone.replace(/\s/g, '')}`} className="hover:text-(--brand-accent) transition-colors">{cfg.biz_phone}</a>
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
                <div className="flex justify-between"><span>Mon – Thu</span><span>{cfg.hours_mon_thu}</span></div>
                <div className="flex justify-between"><span>Fri – Sat</span><span>{cfg.hours_fri_sat}</span></div>
                <div className="flex justify-between"><span>Sunday</span><span>{cfg.hours_sun}</span></div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/8 mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-600">
          <p>© {new Date().getFullYear()} {cfg.biz_name}. All rights reserved.</p>
          <p>Registered in England & Wales</p>
        </div>
      </div>
    </footer>
  )
}
