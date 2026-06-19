import type { Metadata } from 'next'
import { Nunito } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import { Toaster } from 'react-hot-toast'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
  variable: '--font-nunito',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Pizza Guys | Fresh Pizzas, Burgers & More',
  description:
    'Order pizza, burgers, kebabs and more from Pizza Guys. Hot, fresh food delivered to your door. Available in TW18, TW19, TW20 and surrounding areas.',
  keywords: 'pizza delivery, pizza guys, takeaway, burgers, kebabs, staines, surrey',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full ${nunito.variable}`}>
      <body className="min-h-full flex flex-col bg-[#F9F9F9] antialiased">
        <AuthProvider>
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: '#111',
                color: '#fff',
                borderRadius: '0.75rem',
                border: '1px solid #FFD700',
                fontWeight: 700,
              },
              success: { iconTheme: { primary: '#FFD700', secondary: '#111' } },
              error:   { iconTheme: { primary: '#E53935', secondary: '#fff' } },
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
