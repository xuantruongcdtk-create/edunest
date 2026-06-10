import type { Metadata, Viewport } from 'next'
import './globals.css'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://edunest.vn'

export const viewport: Viewport = {
  width:        'device-width',
  initialScale: 1,
  themeColor:   '#1D9E75',
}

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title:        { default: 'EduNest', template: '%s — EduNest' },
  description:  'Nền tảng theo dõi học tập AI cho phụ huynh và giáo viên Việt Nam',
  keywords:     ['edtech', 'học tập', 'phụ huynh', 'giáo viên', 'AI', 'Việt Nam'],
  authors:      [{ name: 'EduNest' }],
  openGraph: {
    type:        'website',
    locale:      'vi_VN',
    url:         APP_URL,
    siteName:    'EduNest',
    title:       'EduNest — Theo dõi học tập AI',
    description: 'Nền tảng theo dõi học tập AI cho phụ huynh và giáo viên Việt Nam',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'EduNest' }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'EduNest — Theo dõi học tập AI',
    description: 'Nền tảng theo dõi học tập AI cho phụ huynh và giáo viên Việt Nam',
    images:      ['/og-image.png'],
  },
  robots: { index: true, follow: true },
  // icons & og-image auto-resolved from app/icon.svg and app/opengraph-image.tsx
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  )
}
