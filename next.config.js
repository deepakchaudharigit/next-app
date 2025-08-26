/** @type {import('next').NextConfig} */

// Increase EventEmitter max listeners to prevent warnings
require('events').EventEmitter.defaultMaxListeners = 20;

const nextConfig = {
  reactStrictMode: true,

  images: {
    domains: ['localhost'],
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
