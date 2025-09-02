/**
 * Root Layout Component
 * Main layout wrapper that provides session context, PWA features, and mobile-optimized styling for the entire NPCL Dashboard application.
 */

import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { SessionProvider } from '@/components/providers/session-provider'
import { PWAProvider } from '@/components/pwa/PWAProvider'
import { PWAInstallPrompt } from '@/components/pwa/PWAInstallPrompt'
import { StructuredData, OrganizationStructuredData } from '@/components/seo/StructuredData'
import { PerformanceOptimizer } from '@/components/performance/PerformanceOptimizer'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'NPCL Dashboard',
    template: '%s | NPCL Dashboard'
  },
  description: 'Comprehensive Power Management Dashboard for NPCL with real-time monitoring, analytics, and mobile-first design',
  keywords: ['power management', 'dashboard', 'NPCL', 'energy monitoring', 'analytics', 'power generation', 'electricity', 'renewable energy', 'grid management'],
  authors: [{ name: 'NPCL Team' }],
  creator: 'NPCL',
  publisher: 'NPCL',
  category: 'technology',
  classification: 'business application',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'NPCL Dashboard',
    startupImage: [
      {
        url: '/icons/apple-splash-2048-2732.png',
        media: '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)'
      },
      {
        url: '/icons/apple-splash-1668-2388.png',
        media: '(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)'
      },
      {
        url: '/icons/apple-splash-1536-2048.png',
        media: '(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)'
      },
      {
        url: '/icons/apple-splash-1125-2436.png',
        media: '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)'
      },
      {
        url: '/icons/apple-splash-1242-2208.png',
        media: '(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)'
      },
      {
        url: '/icons/apple-splash-750-1334.png',
        media: '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)'
      },
      {
        url: '/icons/apple-splash-640-1136.png',
        media: '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)'
      }
    ]
  },
  icons: {
    icon: [
      { url: '/icons/favicon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192x192.svg', sizes: '192x192', type: 'image/svg+xml' },
      { url: '/icons/icon-512x512.svg', sizes: '512x512', type: 'image/svg+xml' }
    ],
    apple: [
      { url: '/icons/apple-touch-icon.svg', sizes: '180x180', type: 'image/svg+xml' }
    ],
    other: [
      { rel: 'mask-icon', url: '/icons/favicon.svg', color: '#4f46e5' }
    ]
  },
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://npcl-dashboard.com',
    siteName: 'NPCL Dashboard',
    title: 'NPCL Power Management Dashboard',
    description: 'Comprehensive Power Management Dashboard for NPCL with real-time monitoring and analytics',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NPCL Dashboard'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NPCL Power Management Dashboard',
    description: 'Comprehensive Power Management Dashboard for NPCL with real-time monitoring and analytics',
    images: ['/og-image.png']
  },
  robots: {
    index: process.env.NODE_ENV === 'production' || process.env.ALLOW_SEO_TESTING === 'true',
    follow: process.env.NODE_ENV === 'production' || process.env.ALLOW_SEO_TESTING === 'true',
    googleBot: {
      index: process.env.NODE_ENV === 'production' || process.env.ALLOW_SEO_TESTING === 'true',
      follow: process.env.NODE_ENV === 'production' || process.env.ALLOW_SEO_TESTING === 'true'
    }
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#4f46e5' },
    { media: '(prefers-color-scheme: dark)', color: '#4f46e5' }
  ],
  colorScheme: 'light'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        {/* PWA Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="NPCL Dashboard" />
        <meta name="application-name" content="NPCL Dashboard" />
        <meta name="msapplication-TileColor" content="#4f46e5" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* Critical Resource Hints - Only for actually used resources */}
        <link rel="dns-prefetch" href="//localhost" />
        
        {/* Resource hints for better performance */}
        <meta httpEquiv="x-dns-prefetch-control" content="on" />
      </head>
      <body className={`${inter.className} h-full antialiased`}>
        <SessionProvider>
          <PWAProvider>
            <PerformanceOptimizer />
            <div className="min-h-screen bg-gray-50 touch-manipulation">
              {children}
              <PWAInstallPrompt />
            </div>
          </PWAProvider>
        </SessionProvider>
        
        {/* Structured Data for SEO */}
        <StructuredData />
        <OrganizationStructuredData />
      </body>
    </html>
  )
}