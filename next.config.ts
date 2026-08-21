import type { NextConfig } from 'next'

// Stripe JS + self — the minimum CSP that still lets checkout and images work
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: *",
  "font-src 'self'",
  "connect-src 'self' https://api.stripe.com https://checkout.stripe.com",
  // www.google.com is needed for the Google Maps "share → embed" iframe on the
  // contact/about pages and in the footer; without it the browser blocks the
  // map and the panel just renders blank.
  "frame-src https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com https://www.openstreetmap.org https://www.google.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

const nextConfig: NextConfig = {
  images: {
    // sharp is installed, so Next resizes and converts every product photo,
    // the hero banners and the logo to WebP/AVIF on first request and caches
    // the result to disk — this is what actually shrinks the images the
    // browser downloads. `unoptimized: true` was serving every original file
    // untouched.
    formats: ['image/avif', 'image/webp'],
    // Next's default deviceSizes starts at 640, but the menu grid is a single
    // full-width column below that (`grid-cols-1` under Tailwind's `sm`
    // breakpoint), so a ~390px phone was jumping straight to a 640px-wide
    // derivative — measured to cost MORE than the original unoptimized JPEG
    // for detailed food photography. Adding 400 gives narrow phones a
    // correctly-sized candidate; every existing breakpoint above it is kept
    // exactly as Next's default, so wider layouts and the full-bleed hero are
    // unaffected.
    deviceSizes: [400, 640, 750, 828, 1080, 1200, 1920, 2048, 3840],
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
        // Excludes /api/uploads/** — a header set here always wins over one a
        // route handler sets, so this blanket no-store was silently deleting
        // the long-lived Cache-Control that the image route sets itself,
        // forcing every product photo to be re-read from disk on every
        // navigation. Every other API (auth, orders, checkout, admin) still
        // gets no-store, unconditionally — sensitive/user-specific responses
        // must never be cached.
        source: '/api/((?!uploads/).*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
        ],
      },
      {
        // Public, non-personal menu data — safe to cache briefly. A price
        // edited in admin can take up to a minute to reach customers, which
        // is a deliberate trade for not re-hitting Postgres on every page
        // view and every header search keystroke.
        source: '/api/menu/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=60, stale-while-revalidate=300' },
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
