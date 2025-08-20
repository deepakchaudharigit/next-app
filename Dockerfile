# NPCL Dashboard Dockerfile
# Multi-stage build for optimized production image with Prisma compatibility

# Stage 1: Dependencies
# Using Debian-based image for better Prisma OpenSSL compatibility
FROM node:18-slim AS deps
RUN apt-get update && apt-get install -y \
    postgresql-client \
    openssl \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files and Prisma schema
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci --only=production

# Stage 2: Builder
# Using Debian-based image for better Prisma OpenSSL compatibility
FROM node:18-slim AS builder
WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    openssl \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy package files and Prisma schema
COPY package.json package-lock.json* ./
COPY prisma ./prisma

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Stage 3: Runner
# Using Debian-based image for better Prisma OpenSSL compatibility
FROM node:18-slim AS runner
WORKDIR /app

# Install runtime dependencies including OpenSSL and PostgreSQL client
RUN apt-get update && apt-get install -y \
    postgresql-client \
    openssl \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create non-root user
RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy all node_modules and dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/lib ./lib

# Copy package files for npm scripts
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json

# Copy scripts directory
COPY --from=builder /app/scripts ./scripts

# Copy startup script and make it executable
COPY scripts/docker/startup.sh ./startup.sh
RUN chmod +x ./startup.sh

# Create necessary Next.js directories with proper permissions
RUN mkdir -p ./.next/cache ./.next/server ./.next/static

# Set correct permissions for all files and directories
RUN chown -R nextjs:nodejs /app
RUN chmod -R 755 /app
RUN chmod -R 777 ./.next

USER nextjs

# Expose port
EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application using startup script
CMD ["/bin/bash", "./startup.sh"]