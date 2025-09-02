/**
 * Structured Data Component
 * Provides JSON-LD structured data for better SEO
 */

export function StructuredData() {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    '@id': `${baseUrl}/#webapp`,
    name: 'NPCL Power Management Dashboard',
    alternateName: 'NPCL Dashboard',
    description: 'Comprehensive Power Management Dashboard for NPCL with real-time monitoring, analytics, and mobile-first design',
    url: baseUrl,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      validFrom: '2024-01-01',
    },
    creator: {
      '@type': 'Organization',
      name: 'NPCL',
      description: 'National Power Corporation Limited',
    },
    featureList: [
      'Real-time power monitoring',
      'Analytics and reporting',
      'Mobile-responsive design',
      'Progressive Web App',
      'Offline functionality',
      'User management',
      'Dashboard visualization',
    ],
    screenshot: `${baseUrl}/og-image.png`,
    image: `${baseUrl}/icons/icon-512x512.svg`,
    logo: `${baseUrl}/icons/icon-192x192.svg`,
    softwareVersion: '1.0.0',
    releaseNotes: 'Initial release with comprehensive power management features',
    requirements: 'Modern web browser with JavaScript enabled',
    permissions: 'Network access for real-time data',
    installUrl: baseUrl,
    downloadUrl: baseUrl,
    supportUrl: `${baseUrl}/support`,
    applicationSuite: 'NPCL Power Management Suite',
    datePublished: '2024-01-01',
    dateModified: new Date().toISOString().split('T')[0],
    maintainer: {
      '@type': 'Organization',
      name: 'NPCL Development Team',
    },
    audience: {
      '@type': 'Audience',
      audienceType: 'Power Industry Professionals',
    },
    usageInfo: 'Professional power management and monitoring tool',
    accessibilityFeature: [
      'alternativeText',
      'readingOrder',
      'structuralNavigation',
      'tableOfContents',
    ],
    accessibilityControl: [
      'fullKeyboardControl',
      'fullMouseControl',
      'fullTouchControl',
    ],
    accessibilityHazard: 'none',
    accessMode: [
      'textual',
      'visual',
    ],
    accessModeSufficient: [
      'textual',
      'visual',
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData, null, 2),
      }}
    />
  )
}

export function OrganizationStructuredData() {
  const organizationData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'NPCL',
    alternateName: 'National Power Corporation Limited',
    description: 'Leading power generation and distribution company',
    url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    logo: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/icons/icon-512x512.svg`,
    sameAs: [
      // Add social media URLs here when available
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Technical Support',
      availableLanguage: 'English',
    },
    areaServed: {
      '@type': 'Country',
      name: 'India',
    },
    knowsAbout: [
      'Power Generation',
      'Energy Management',
      'Grid Operations',
      'Renewable Energy',
      'Power Distribution',
    ],
    memberOf: {
      '@type': 'Organization',
      name: 'Power Industry Association',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(organizationData, null, 2),
      }}
    />
  )
}

export function BreadcrumbStructuredData({ items }: { items: Array<{ name: string; url: string }> }) {
  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(breadcrumbData, null, 2),
      }}
    />
  )
}