import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login - NPCL Dashboard',
  description: 'Sign in to NPCL Power Management Dashboard. Access real-time power monitoring, grid operations, and comprehensive energy management tools.',
  keywords: ['NPCL login', 'power dashboard sign in', 'energy management login', 'grid operations access'],
  openGraph: {
    title: 'Login - NPCL Dashboard',
    description: 'Sign in to access NPCL Power Management Dashboard',
    type: 'website',
  },
  robots: {
    index: false, // Don't index login page
    follow: false,
  },
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}