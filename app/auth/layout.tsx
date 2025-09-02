import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Authentication - NPCL Dashboard',
  description: 'Secure login and registration for NPCL Power Management Dashboard. Access your power monitoring and management tools with enterprise-grade security.',
  keywords: ['NPCL login', 'power dashboard login', 'energy management access', 'secure authentication', 'power system login'],
  openGraph: {
    title: 'Authentication - NPCL Dashboard',
    description: 'Secure access to NPCL Power Management Dashboard',
    type: 'website',
  },
  robots: {
    index: false, // Don't index auth pages
    follow: false,
  },
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}