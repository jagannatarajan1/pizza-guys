import Link from 'next/link'
import { Phone, Mail, MapPin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                <span className="text-white font-black text-lg">PG</span>
              </div>
              <span className="font-black text-xl text-white">Pizza Guys</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Fresh handmade pizzas, juicy burgers and sizzling kebabs delivered hot to your door. Family-run since 2009.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-9 h-9 bg-gray-800 hover:bg-red-600 rounded-lg flex items-center justify-center transition-colors text-sm font-bold">f</a>
              <a href="#" className="w-9 h-9 bg-gray-800 hover:bg-red-600 rounded-lg flex items-center justify-center transition-colors text-sm font-bold">in</a>
              <a href="#" className="w-9 h-9 bg-gray-800 hover:bg-red-600 rounded-lg flex items-center justify-center transition-colors text-sm font-bold">𝕏</a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="font-bold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              {[
                { href: '/', label: 'Home' },
                { href: '/menu', label: 'Menu' },
                { href: '/offers', label: 'Special Offers' },
                { href: '/about', label: 'About Us' },
                { href: '/contact', label: 'Contact Us' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-red-400 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-bold text-white mb-4">Information</h3>
            <ul className="space-y-2 text-sm">
              {[
                { href: '/terms', label: 'Terms & Conditions' },
                { href: '/privacy', label: 'Privacy Policy' },
                { href: '/allergens', label: 'Allergy Information' },
                { href: '/dashboard', label: 'My Account' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-red-400 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-white mb-4">Get In Touch</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin size={16} className="text-red-400 shrink-0 mt-0.5" />
                <span>209 Laleham Road, Staines-upon-Thames, Surrey, TW18 2EA</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={16} className="text-red-400 shrink-0" />
                <a href="tel:01784452888" className="hover:text-red-400 transition-colors">
                  01784 452 888
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={16} className="text-red-400 shrink-0" />
                <a href="mailto:info@pizzaguys.co.uk" className="hover:text-red-400 transition-colors">
                  info@pizzaguys.co.uk
                </a>
              </li>
            </ul>
            <div className="mt-4 p-3 bg-gray-800 rounded-lg text-xs">
              <div className="font-semibold text-white mb-1">Opening Hours</div>
              <div>Mon-Thu: 11:00 – 23:00</div>
              <div>Fri-Sat: 11:00 – 23:30</div>
              <div>Sun: 12:00 – 23:00</div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} Pizza Guys. All rights reserved.</p>
          <p>Registered in England & Wales. Company No. 123456789</p>
        </div>
      </div>
    </footer>
  )
}
