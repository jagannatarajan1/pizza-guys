import type { NextConfig } from 'next'

// Stripe JS + Cloudinary + self — the minimum CSP that still lets checkout and images work
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com",
  "font-src 'self'",
  "connect-src 'self' https://api.stripe.com https://checkout.stripe.com",
  "frame-src https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'ngrok-skip-browser-warning',      value: 'true' },
          { key: 'X-Frame-Options',                  value: 'DENY' },
          { key: 'X-Content-Type-Options',           value: 'nosniff' },
          { key: 'Referrer-Policy',                  value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',               value: 'camera=(), microphone=(), geolocation=(), payment=()' },
          { key: 'X-XSS-Protection',                 value: '1; mode=block' },
          { key: 'Content-Security-Policy',          value: CSP },
          { key: 'Strict-Transport-Security',        value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Cross-Origin-Opener-Policy',       value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy',     value: 'same-origin' },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
        ],
      },
      {
        // Stripe webhook must NOT have CORP header — Stripe sends cross-origin POST
        source: '/api/webhooks/stripe',
        headers: [
          { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
        ],
      },
    ]
  },
}

export default nextConfig
