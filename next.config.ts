import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(process.cwd()),
  },
  async redirects() {
    return [
      { source: '/icon', destination: '/icon.png', permanent: true },
      { source: '/opengraph-image', destination: '/opengraph-image.png', permanent: true },
      { source: '/og-image.png', destination: '/og-cover.png', permanent: true },
    ]
  },
  async headers() {
    return [
      {
        source: '/nfts/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      {
        source: '/metadata/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      {
        source: '/:file(icon.png|og-cover.png|opengraph-image.png|app-icon.png)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value:
              "script-src 'self' 'unsafe-eval' https://vercel.live https://*.vercel.live; frame-ancestors 'self' https://base.org https://*.base.org https://base.app https://*.base.app https://vercel.app https://*.vercel.app",
          },
        ],
      },
    ]
  },
}

export default nextConfig
