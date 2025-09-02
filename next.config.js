/** @type {import('next').NextConfig} */

// Increase EventEmitter max listeners to prevent warnings
require('events').EventEmitter.defaultMaxListeners = 20;

const nextConfig = {
  reactStrictMode: true,

  // Basic performance optimizations
  poweredByHeader: false,
  compress: true,
  
  // Performance optimizations
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['recharts', 'zod', 'clsx'],
  },
  
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Headers for better caching and security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ],
      },
      {
        source: '/icons/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400'
          }
        ],
      }
    ];
  },

  // For Docker/production builds: bundle a self-contained server
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,

  // Webpack tweaks for Prisma inside containers
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Keep Prisma as a server dependency without trying to bundle native engines
      config.externals.push({ '@prisma/client': 'commonjs @prisma/client' });
    }
    return config;
  },
};

module.exports = nextConfig;
