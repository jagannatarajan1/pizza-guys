import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [{ key: 'ngrok-skip-browser-warning', value: 'true' }],
      },
    ]
  },
}

export default nextConfig
