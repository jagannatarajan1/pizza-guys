import Link from 'next/link'
import { Phone, Mail, MapPin, Clock } from 'lucide-react'
import BrandLogo from '@/components/BrandLogo'

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
  return (
    <footer className="bg-[#111] text-gray-400 mt-20">
      {/* Top yellow bar */}
      <div className="h-1 bg-linear-to-r from-[#E53935] via-[#FFD700] to-[#27AE60]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand */}
          <div>
            <div className="mb-5">
              <BrandLogo size="md" />
            </div>
            <p className="text-sm text-gray-500 leading-relaxed mb-5">
              Fresh handmade pizzas, juicy burgers & sizzling kebabs delivered hot to your door. Family-run since 2009.
            </p>
            {/* Social icons */}
            <div className="flex gap-2">
              {[
                { label: 'f',   title: 'Facebook' },
                { label: 'ig',  title: 'Instagram' },
                { label: '𝕏',   title: 'X / Twitter' },
              ].map((s) => (
                <a
                  key={s.title}
                  href="#"
                  title={s.title}
                  className="w-9 h-9 bg-white/6 hover:bg-[#FFD700] hover:text-[#111] text-gray-400 rounded-xl flex items-center justify-center transition-all duration-150 text-xs font-black"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="font-black text-white mb-4 text-sm uppercase tracking-widest">Quick Links</h3>
            <ul className="space-y-2.5 text-sm">
              {quickLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-[#FFD700] transition-colors flex items-center gap-2 group">
                    <span className="w-1 h-1 rounded-full bg-[#FFD700] opacity-0 group-hover:opacity-100 transition-opacity" />
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
                  <Link href={l.href} className="hover:text-[#FFD700] transition-colors flex items-center gap-2 group">
                    <span className="w-1 h-1 rounded-full bg-[#FFD700] opacity-0 group-hover:opacity-100 transition-opacity" />
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
                <MapPin size={15} className="text-[#FFD700] shrink-0 mt-0.5" />
                <span className="leading-snug">209 Laleham Road, Staines-upon-Thames, Surrey, TW18 2EA</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={15} className="text-[#FFD700] shrink-0" />
                <a href="tel:01784452888" className="hover:text-[#FFD700] transition-colors">01784 452 888</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={15} className="text-[#FFD700] shrink-0" />
                <a href="mailto:info@pizzaguys.co.uk" className="hover:text-[#FFD700] transition-colors">info@pizzaguys.co.uk</a>
              </li>
            </ul>

            <div className="bg-white/5 rounded-xl p-4 text-xs border border-white/8">
              <div className="flex items-center gap-2 font-black text-white mb-2">
                <Clock size={13} className="text-[#FFD700]" /> Opening Hours
              </div>
              <div className="space-y-1 text-gray-400">
                <div className="flex justify-between"><span>Mon – Thu</span><span>11:00 – 23:00</span></div>
                <div className="flex justify-between"><span>Fri – Sat</span><span>11:00 – 23:30</span></div>
                <div className="flex justify-between"><span>Sunday</span><span>12:00 – 23:00</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/8 mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-600">
          <p>© {new Date().getFullYear()} Pizza Guys. All rights reserved.</p>
          <p>Registered in England & Wales</p>
        </div>
      </div>
    </footer>
  )
}
