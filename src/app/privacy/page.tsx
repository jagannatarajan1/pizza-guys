import { fetchSiteConfig } from '@/lib/site-config'

export const metadata = { title: 'Privacy Policy | Pizza Guys' }

export default async function PrivacyPage() {
  const cfg = await fetchSiteConfig()
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-black text-gray-900 mb-2">Privacy Policy</h1>
      <p className="text-gray-500 text-sm mb-8">Last updated: 1 January 2025</p>
      <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
        {[
          { title: '1. Information We Collect', body: 'We collect information you provide when you register, place an order, or contact us. This includes your name, email address, phone number, delivery address, and payment information (tokenised through our payment provider).' },
          { title: '2. How We Use Your Information', body: 'We use your information to process orders, communicate about your order status, improve our service, and occasionally send you promotional offers (with your consent). We will never sell your personal data to third parties.' },
          { title: '3. Cookies', body: 'Our website uses cookies to enhance your browsing experience. Cookies help us remember your cart, preferences, and login status. You can disable cookies in your browser settings, though some features may not work properly.' },
          { title: '4. Data Security', body: 'We take data security seriously. All data is transmitted over HTTPS. Payment card data is never stored on our servers — it is tokenised by our PCI-DSS compliant payment provider.' },
          { title: '5. Data Retention', body: 'We retain your account data for as long as your account is active. Order history is kept for 7 years for legal and accounting purposes. You may request deletion of your account at any time.' },
          { title: '6. Your Rights', body: `Under GDPR, you have the right to access, correct, delete, and port your personal data. You also have the right to object to processing and to withdraw consent. Contact us at ${cfg.biz_email} to exercise these rights.` },
          { title: '7. Third Parties', body: 'We use trusted third-party services including payment processors, delivery tracking systems, and analytics providers. These parties are bound by their own privacy policies and only receive data necessary for their services.' },
          { title: '8. Contact', body: `For privacy-related queries, contact our data controller at ${cfg.biz_email} or write to: ${cfg.biz_name}, ${cfg.biz_address}.` },
        ].map((s) => (
          <div key={s.title}>
            <h2 className="text-base font-bold text-gray-900 mb-2">{s.title}</h2>
            <p>{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
