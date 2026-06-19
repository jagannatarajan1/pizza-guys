import { Phone, Mail, MapPin, Clock, Heart, Zap, Star, Users } from 'lucide-react'

export const metadata = { title: 'About Us | Pizza Guys' }

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <div className="bg-gray-900 text-white py-16 px-4 sm:px-6 text-center">
        <h1 className="text-4xl font-black mb-3">Our Story</h1>
        <p className="text-gray-400 max-w-xl mx-auto">A family business with a passion for great food and even better service</p>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        {/* Story */}
        <section className="grid lg:grid-cols-2 gap-12 mb-16 items-center">
          <div>
            <h2 className="text-3xl font-black text-gray-900 mb-4">From Our Family to Yours</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Pizza Guys was founded in 2009 with a simple mission: to serve the best handmade pizzas, burgers, and kebabs to the families of Staines and surrounding areas. What started as a small local takeaway has grown into a much-loved institution in our community.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              We believe that great food starts with great ingredients. That&apos;s why we source fresh produce daily, make our dough in-house every morning, and use authentic recipes that have been refined over 15+ years.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Today, we&apos;re proud to have served over 200,000 meals and counting. From birthday parties to weeknight dinners, Pizza Guys has been part of thousands of family moments across Surrey and Middlesex.
            </p>
          </div>
          <div className="bg-red-50 rounded-2xl p-8 grid grid-cols-2 gap-6 text-center">
            {[
              { value: '15+', label: 'Years in Business' },
              { value: '200K+', label: 'Meals Served' },
              { value: '4.8★', label: 'Average Rating' },
              { value: '30 min', label: 'Avg Delivery' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-black text-red-600 mb-1">{stat.value}</div>
                <div className="text-gray-600 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Why us */}
        <section className="mb-16">
          <h2 className="text-3xl font-black text-gray-900 text-center mb-8">Why Choose Us?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Heart, title: 'Fresh Ingredients', desc: 'We source fresh, quality ingredients daily and never compromise on flavour.' },
              { icon: Zap, title: 'Fast Delivery', desc: 'Hot food at your door in 30–45 minutes. We guarantee it arrives fresh.' },
              { icon: Star, title: 'Quality Service', desc: 'Our friendly team is always ready to help — before, during and after your order.' },
              { icon: Users, title: 'Customer First', desc: 'Over 2,000 five-star reviews from happy customers across our community.' },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl p-5 border border-gray-100 text-center">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <item.icon className="text-red-600" size={22} />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Gallery placeholder */}
        <section className="mb-16">
          <h2 className="text-3xl font-black text-gray-900 text-center mb-8">Our Kitchen</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              '/images/Pizza/Meat feast.avif',
              '/images/Pizza/Pepperoni feast.avif',
              '/images/Pizza/Chicken tikka.avif',
              '/images/Burgers/Bbq smash burger.avif',
              '/images/Kebab/Chicken Kebab.avif',
              '/images/Sides/Cheesy chips.avif',
            ].map((src, i) => (
              <div key={i} className="aspect-square rounded-2xl overflow-hidden bg-gray-100">
                <img src={src} alt="Food" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </section>

        {/* Opening hours + Contact */}
        <section className="grid sm:grid-cols-2 gap-6 mb-12">
          <div className="bg-gray-900 text-white rounded-2xl p-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Clock size={18} className="text-red-400" /> Opening Hours</h3>
            <div className="space-y-2 text-sm">
              {[
                { day: 'Monday – Thursday', hours: '11:00 – 23:00' },
                { day: 'Friday – Saturday', hours: '11:00 – 23:30' },
                { day: 'Sunday', hours: '12:00 – 23:00' },
              ].map((h) => (
                <div key={h.day} className="flex justify-between">
                  <span className="text-gray-400">{h.day}</span>
                  <span className="font-medium">{h.hours}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <h3 className="font-bold text-lg text-gray-900 mb-4">Contact Us</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3"><MapPin size={16} className="text-red-500 shrink-0 mt-0.5" /><span className="text-gray-600">209 Laleham Road, Staines-upon-Thames, Surrey, TW18 2EA</span></div>
              <div className="flex items-center gap-3"><Phone size={16} className="text-red-500" /><a href="tel:01784452888" className="text-gray-600 hover:text-red-600">01784 452 888</a></div>
              <div className="flex items-center gap-3"><Mail size={16} className="text-red-500" /><a href="mailto:info@pizzaguys.co.uk" className="text-gray-600 hover:text-red-600">info@pizzaguys.co.uk</a></div>
            </div>
          </div>
        </section>

        {/* Map placeholder */}
        <div className="bg-gray-100 rounded-2xl h-64 flex items-center justify-center text-gray-400 text-sm">
          <div className="text-center">
            <MapPin size={32} className="mx-auto mb-2" />
            <p>Google Maps — 209 Laleham Road, Staines-upon-Thames, TW18 2EA</p>
          </div>
        </div>
      </div>
    </div>
  )
}
