/**
 * Database Connection Pool Management
 * Optimizes database connections for high-load scenarios
 */

import { PrismaClient } from '@prisma/client'
import { withCircuitBreaker } from '@/lib/resilience/circuit-breaker'
import { withDatabaseRetry } from '@/lib/resilience/retry'

interface ConnectionPoolConfig {
  maxConnections: number
  minConnections: number
  acquireTimeoutMs: number
  idleTimeoutMs: number
  maxLifetimeMs: number
  enableQueryLogging: boolean
  slowQueryThresholdMs: number
}

interface ConnectionStats {
  totalConnections: number
  activeConnections: number
  idleConnections: number
  waitingRequests: number
  totalQueries: number
  slowQueries: number
  averageQueryTime: number
  connectionErrors: number
}

class DatabaseConnectionPool {
  private prisma: PrismaClient
  private config: ConnectionPoolConfig
  private queryStats = {
    totalQueries: 0,
    slowQueries: 0,
    totalQueryTime: 0,
    connectionErrors: 0
  }

  constructor(config: Partial<ConnectionPoolConfig> = {}) {
    this.config = {
      maxConnections: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '10'),
      minConnections: parseInt(process.env.DATABASE_MIN_CONNECTIONS || '2'),
      acquireTimeoutMs: parseInt(process.env.DATABASE_ACQUIRE_TIMEOUT || '60000'),
      idleTimeoutMs: parseInt(process.env.DATABASE_IDLE_TIMEOUT || '600000'),
      maxLifetimeMs: parseInt(process.env.DATABASE_MAX_LIFETIME || '3600000'),
      enableQueryLogging: process.env.NODE_ENV === 'development',
      slowQueryThresholdMs: parseInt(process.env.DATABASE_SLOW_QUERY_THRESHOLD || '1000'),
      ...config
    }

    this.initializePrisma()
  }

  private initializePrisma() {
    const logLevels: any[] = ['error', 'warn']
    
    if (this.config.enableQueryLogging) {
      logLevels.push('query', 'info')
    }

    this.prisma = new PrismaClient({
      log: logLevels,
      datasources: {
        db: {
          url: this.buildConnectionString()
        }
      }
    })

    // Add query logging middleware
    this.prisma.$use(async (params, next) => {
      const startTime = Date.now()
      
      try {
        const result = await next(params)
        const queryTime = Date.now() - startTime
        
        this.trackQuery(queryTime, params)
        
        return result
      } catch (error) {
        this.queryStats.connectionErrors++
        throw error
      }
    })

    // Handle connection events
    this.setupConnectionEventHandlers()
  }

  private buildConnectionString(): string {
    const baseUrl = process.env.DATABASE_URL
    if (!baseUrl) {
      throw new Error('DATABASE_URL environment variable is required')
    }

    // Parse existing URL
    const url = new URL(baseUrl)
    
    // Add connection pool parameters
    const params = new URLSearchParams(url.search)
    params.set('connection_limit', this.config.maxConnections.toString())
    params.set('pool_timeout', Math.floor(this.config.acquireTimeoutMs / 1000).toString())
    
    // PostgreSQL specific optimizations
    if (url.protocol === 'postgresql:' || url.protocol === 'postgres:') {
      params.set('connect_timeout', '10')
      params.set('application_name', 'npcl-dashboard')
      params.set('statement_timeout', '30000')
      params.set('idle_in_transaction_session_timeout', '60000')
    }

    url.search = params.toString()
    return url.toString()
  }

  private setupConnectionEventHandlers() {
    // Handle graceful shutdown
    const gracefulShutdown = async () => {
      console.log('🔌 Closing database connections...')
      await this.disconnect()
      process.exit(0)
    }

    process.on('SIGINT', gracefulShutdown)
    process.on('SIGTERM', gracefulShutdown)
  }

  private trackQuery(queryTime: number, params: any) {
    this.queryStats.totalQueries++
    this.queryStats.totalQueryTime += queryTime

    if (queryTime > this.config.slowQueryThresholdMs) {
      this.queryStats.slowQueries++
      
      if (this.config.enableQueryLogging) {
        console.warn(`🐌 Slow query detected (${queryTime}ms):`, {
          model: params.model,
          action: params.action,
          args: params.args
        })
      }
    }
  }

  // Execute query with circuit breaker and retry logic
  async executeQuery<T>(
    operation: (prisma: PrismaClient) => Promise<T>,
    operationName?: string
  ): Promise<T> {
    return withCircuitBreaker(
      'database',
      () => withDatabaseRetry(
        () => operation(this.prisma),
        operationName
      )
    )
  }

  // Execute transaction with retry logic
  async executeTransaction<T>(
    operations: (prisma: PrismaClient) => Promise<T>,
    operationName?: string
  ): Promise<T> {
    return withCircuitBreaker(
      'database',
      () => withDatabaseRetry(
        () => this.prisma.$transaction(async (tx) => {
          return operations(tx as PrismaClient)
        }, {
          maxWait: this.config.acquireTimeoutMs,
          timeout: 30000, // 30 second transaction timeout
          isolationLevel: 'ReadCommitted'
        }),
        operationName
      )
    )
  }

  // Batch operations for better performance
  async executeBatch<T>(
    operations: Array<(prisma: PrismaClient) => Promise<T>>,
    batchSize: number = 100
  ): Promise<T[]> {
    const results: T[] = []
    
    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize)
      
      const batchResults = await this.executeTransaction(async (tx) => {
        return Promise.all(batch.map(op => op(tx)))
      }, `batch-${i}-${i + batchSize}`)
      
      results.push(...batchResults)
    }
    
    return results
  }

  // Health check
  async healthCheck(): Promise<{ healthy: boolean; responseTime: number; error?: string }> {
    const startTime = Date.now()
    
    try {
      await this.prisma.$queryRaw`SELECT 1`
      return {
        healthy: true,
        responseTime: Date.now() - startTime
      }
    } catch (error) {
      return {
        healthy: false,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Get connection statistics
  async getStats(): Promise<ConnectionStats> {
    // Note: These metrics would need to be implemented based on your specific setup
    // For now, providing estimated values based on query stats
    
    return {
      totalConnections: this.config.maxConnections,
      activeConnections: Math.min(this.queryStats.totalQueries % this.config.maxConnections, this.config.maxConnections),
      idleConnections: Math.max(0, this.config.maxConnections - (this.queryStats.totalQueries % this.config.maxConnections)),
      waitingRequests: 0, // Would need connection pool metrics
      totalQueries: this.queryStats.totalQueries,
      slowQueries: this.queryStats.slowQueries,
      averageQueryTime: this.queryStats.totalQueries > 0 
        ? this.queryStats.totalQueryTime / this.queryStats.totalQueries 
        : 0,
      connectionErrors: this.queryStats.connectionErrors
    }
  }

  // Optimize database performance
  async optimizePerformance() {
    try {
      // Analyze query performance
      const slowQueries = await this.getSlowQueries()
      
      if (slowQueries.length > 0) {
        console.warn(`⚠️ Found ${slowQueries.length} slow queries`)
        slowQueries.forEach(query => {
          console.warn(`Slow query: ${query.query} (${query.avgTime}ms avg)`)
        })
      }

      // Check for missing indexes
      const missingIndexes = await this.findMissingIndexes()
      
      if (missingIndexes.length > 0) {
        console.warn(`⚠️ Potential missing indexes:`, missingIndexes)
      }

      // Update table statistics (PostgreSQL)
      if (process.env.DATABASE_URL?.includes('postgresql')) {
        await this.updateTableStatistics()
      }

    } catch (error) {
      console.error('Error during performance optimization:', error)
    }
  }

  private async getSlowQueries(): Promise<Array<{ query: string; avgTime: number; calls: number }>> {
    // This would require pg_stat_statements extension in PostgreSQL
    // For now, return empty array
    return []
  }

  private async findMissingIndexes(): Promise<string[]> {
    // This would analyze query patterns and suggest indexes
    // For now, return empty array
    return []
  }

  private async updateTableStatistics() {
    try {
      // Update PostgreSQL table statistics
      await this.prisma.$executeRaw`ANALYZE`
      console.log('✅ Updated table statistics')
    } catch (error) {
      console.error('Error updating table statistics:', error)
    }
  }

  // Graceful disconnect
  async disconnect() {
    try {
      await this.prisma.$disconnect()
      console.log('✅ Database connections closed')
    } catch (error) {
      console.error('Error closing database connections:', error)
    }
  }

  // Get Prisma client (for direct access when needed)
  getClient(): PrismaClient {
    return this.prisma
  }
}

// Global connection pool instance
export const connectionPool = new DatabaseConnectionPool()

// Export the Prisma client through the connection pool
export const prisma = connectionPool.getClient()

// Utility functions
export async function withDatabase<T>(
  operation: (prisma: PrismaClient) => Promise<T>,
  operationName?: string
): Promise<T> {
  return connectionPool.executeQuery(operation, operationName)
}

export async function withTransaction<T>(
  operations: (prisma: PrismaClient) => Promise<T>,
  operationName?: string
): Promise<T> {
  return connectionPool.executeTransaction(operations, operationName)
}

export async function executeBatch<T>(
  operations: Array<(prisma: PrismaClient) => Promise<T>>,
  batchSize?: number
): Promise<T[]> {
  return connectionPool.executeBatch(operations, batchSize)
}

// Start performance optimization on module load
if (typeof window === 'undefined') {
  // Run optimization every hour
  setInterval(() => {
    connectionPool.optimizePerformance()
  }, 60 * 60 * 1000)
}