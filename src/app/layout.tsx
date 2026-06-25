import type { Metadata } from 'next'
import { Nunito } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import { SiteConfigProvider } from '@/context/SiteConfigContext'
import { OrderTypeProvider } from '@/context/OrderTypeContext'
import { Toaster } from 'react-hot-toast'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ThemeScript from '@/components/ThemeScript'
import ShopStatusBanner from '@/components/ShopStatusBanner'
import { fetchSiteConfig } from '@/lib/site-config'

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
  variable: '--font-nunito',
  display: 'swap',
})

export async function generateMetadata(): Promise<Metadata> {
  const config = await fetchSiteConfig()
  return {
    title:       config.seo_title,
    description: config.seo_description,
    keywords:    'pizza delivery, pizza guys, takeaway, burgers, kebabs, staines, surrey',
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const config = await fetchSiteConfig()

  return (
    <html lang="en" className={`h-full ${nunito.variable}`}>
      <head>
        <ThemeScript config={config} />
      </head>
      <body className="min-h-full flex flex-col bg-[#F9F9F9] antialiased">
        <SiteConfigProvider initial={config}>
          <OrderTypeProvider>
            <AuthProvider>
              <Toaster
                position="top-center"
                toastOptions={{
                  style: {
                    background: '#111',
                    color: '#fff',
                    borderRadius: '0.75rem',
                    border: '1px solid var(--brand-accent)',
                    fontWeight: 700,
                  },
                  success: { iconTheme: { primary: '#FFD700', secondary: '#111' } },
                  error:   { iconTheme: { primary: '#E53935', secondary: '#fff' } },
                }}
              />
              <Header />
              <ShopStatusBanner />
              <main className="flex-1">{children}</main>
              <Footer />
            </AuthProvider>
          </OrderTypeProvider>
        </SiteConfigProvider>
      </body>
    </html>
  )
}
