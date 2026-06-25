export const metadata = { title: 'Refund Policy | Pizza Guys' }

const sections = [
  {
    title: '1. Our Commitment',
    body: 'At Pizza Guys, we take great pride in the quality of our food. If you are not completely satisfied with your order, please contact us immediately and we will do our best to resolve the issue.',
  },
  {
    title: '2. Eligibility for Refunds',
    body: 'Refunds or replacements may be offered in the following situations: (a) Your order was significantly incorrect; (b) Your food arrived in an unsatisfactory condition; (c) Your order was not delivered within a reasonable time and you no longer require it. We are unable to offer refunds for orders where the customer has simply changed their mind after the food has been prepared.',
  },
  {
    title: '3. How to Request a Refund',
    body: 'Please contact us as soon as possible after receiving your order — ideally within 30 minutes. You can reach us by phone at 01784 452 888 or by email at info@pizzaguys.co.uk. Please have your order number ready.',
  },
  {
    title: '4. Refund Processing',
    body: 'Approved refunds for card payments are processed back to the original payment method within 5–10 business days, depending on your card issuer. Cash orders are refunded in cash upon collection or via bank transfer at our discretion.',
  },
  {
    title: '5. Partial Refunds',
    body: 'Where only part of an order is affected, we may offer a partial refund or a replacement item rather than a full refund.',
  },
  {
    title: '6. Delivery Issues',
    body: 'If your order is significantly delayed due to circumstances within our control, please contact us. We will assess each case individually and offer an appropriate resolution.',
  },
  {
    title: '7. Allergen Complaints',
    body: 'If you believe you have received food containing an allergen that was not declared, please contact us immediately. We take allergen concerns very seriously and will investigate promptly.',
  },
  {
    title: '8. Changes to This Policy',
    body: 'We reserve the right to update this Refund Policy at any time. Changes will be posted on this page.',
  },
]

export default function RefundPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-black text-gray-900 mb-2">Refund Policy</h1>
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
