import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard - NPCL Power Management',
  description: 'NPCL Power Management Dashboard - Real-time monitoring of power generation, grid operations, and system analytics. Access comprehensive power management tools and reports.',
  keywords: ['power dashboard', 'energy monitoring', 'grid management', 'power generation', 'NPCL dashboard', 'electricity monitoring', 'power analytics'],
  openGraph: {
    title: 'Dashboard - NPCL Power Management',
    description: 'Real-time power monitoring and management dashboard',
    type: 'website',
  },
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}