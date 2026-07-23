export const metadata = { title: 'Cookie Policy | Pizza Guys' }

const sections = [
  {
    title: '1. What Are Cookies',
    body: 'Cookies are small text files stored on your device when you visit our website. They help us provide you with a better experience by remembering your preferences and understanding how you use our site.',
  },
  {
    title: '2. Cookies We Use',
    body: 'We use the following types of cookies: (a) Essential cookies — required for the website to function, including your login session and shopping cart; (b) Preference cookies — remember your order type selection (delivery or collection) and other settings; (c) Analytics cookies — help us understand how customers use our site so we can improve it.',
  },
  {
    title: '3. Essential Cookies',
    body: 'These cookies are necessary for the website to work and cannot be switched off. They include session cookies that keep you logged in and cart cookies that save your cart items between page loads.',
  },
  {
    title: '4. Third-Party Cookies',
    body: 'Our payment processor (Stripe) may set cookies when you proceed to checkout. These are governed by Stripe\'s own privacy and cookie policy. We do not control these cookies.',
  },
  {
    title: '5. Managing Cookies',
    body: 'You can control and delete cookies through your browser settings. Please be aware that disabling essential cookies may affect the functionality of this website, including your ability to log in or complete an order.',
  },
  {
    title: '6. Changes to This Policy',
    body: 'We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated date.',
  },
  {
    title: '7. Contact Us',
    body: 'If you have any questions about our use of cookies, please contact us at info@pizzaguys.co.uk or call 01784 452 888.',
  },
]

export default function CookiePolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-black text-gray-900 mb-2">Cookie Policy</h1>
      <p className="text-gray-500 text-sm mb-8">Last updated: 1 January 2025</p>
      <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
        {sections.map((s) => (
          <div key={s.title}>
            <h2 className="font-black text-gray-900 mb-2">{s.title}</h2>
            <p>{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
