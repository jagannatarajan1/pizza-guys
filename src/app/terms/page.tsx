export const metadata = { title: 'Terms & Conditions | Pizza Guys' }

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-black text-gray-900 mb-2">Terms &amp; Conditions</h1>
      <p className="text-gray-500 text-sm mb-8">Last updated: 1 January 2025</p>
      <div className="prose prose-gray max-w-none space-y-6 text-sm text-gray-700 leading-relaxed">
        {[
          { title: '1. Introduction', body: 'These Terms and Conditions govern your use of the Pizza Guys website and ordering service. By placing an order, you agree to be bound by these terms.' },
          { title: '2. Orders', body: 'All orders are subject to availability and confirmation. We reserve the right to refuse or cancel any order at our discretion. Payment must be received in full before your order is processed.' },
          { title: '3. Prices', body: 'All prices are displayed in GBP (£) and include VAT where applicable. Prices are subject to change without notice. The price charged will be the price displayed at the time of ordering.' },
          { title: '4. Delivery', body: 'Delivery times are estimates only and not guaranteed. We aim to deliver within 30–45 minutes but cannot be held responsible for delays caused by traffic, weather, or other circumstances beyond our control.' },
          { title: '5. Allergens', body: 'We handle allergens in our kitchen. While we take all reasonable precautions, we cannot guarantee that our food is entirely free from allergens. Please inform us of any allergies before ordering.' },
          { title: '6. Refunds and Complaints', body: 'If you are unhappy with your order, please contact us within 1 hour of delivery. We will do our best to resolve the issue. Refunds are issued at our discretion.' },
          { title: '7. Intellectual Property', body: 'All content on this website, including text, images and logos, is the property of Pizza Guys and may not be reproduced without permission.' },
          { title: '8. Privacy', body: 'Your personal data is collected and processed in accordance with our Privacy Policy. We do not sell your data to third parties.' },
          { title: '9. Governing Law', body: 'These terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.' },
          { title: '10. Contact', body: 'For any questions about these terms, please contact us at info@pizzaguys.co.uk or call 01784 452 888.' },
        ].map((section) => (
          <div key={section.title}>
            <h2 className="text-base font-bold text-gray-900 mb-2">{section.title}</h2>
            <p>{section.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
