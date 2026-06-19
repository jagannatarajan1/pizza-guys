import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import { Toaster } from 'react-hot-toast'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Pizza Guys | Fresh Pizzas, Burgers & More',
  description:
    'Order pizza, burgers, kebabs and more from Pizza Guys. Hot, fresh food delivered to your door. Available in TW18, TW19, TW20 and surrounding areas.',
  keywords: 'pizza delivery, pizza guys, takeaway, burgers, kebabs, staines, surrey',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-gray-50 antialiased">
        <AuthProvider>
          <Toaster
            position="top-center"
            toastOptions={{
              style: { background: '#1a1a1a', color: '#fff', borderRadius: '0.75rem' },
              success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
            }}
          />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  )
}
