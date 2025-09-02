import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const isProduction = process.env.NODE_ENV === 'production'
  const allowTesting = process.env.ALLOW_SEO_TESTING === 'true'
  
  // Allow indexing in production OR when testing SEO
  if (!isProduction && !allowTesting) {
    // Block all crawlers in development (unless testing)
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    }
  }
  
  // Allow crawlers in production
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/auth/register',
          '/auth/profile',
          '/_next/',
          '/admin/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/auth/register',
          '/auth/profile',
          '/_next/',
          '/admin/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}