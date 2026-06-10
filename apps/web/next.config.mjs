/** @type {import('next').NextConfig} */
const config = {
  transpilePackages: [
    '@edunest/types',
    '@edunest/core',
    '@edunest/db',
    '@edunest/cache',
    '@edunest/ai',
    '@edunest/services',
  ],

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },

  experimental: {
    serverComponentsExternalPackages: ['@google/generative-ai'],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',           value: 'DENY' },
          { key: 'X-Content-Type-Options',     value: 'nosniff' },
          { key: 'Referrer-Policy',            value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',         value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-DNS-Prefetch-Control',     value: 'on' },
        ],
      },
    ]
  },
}

export default config
