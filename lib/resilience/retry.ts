/**
 * Retry Logic with Exponential Backoff
 * Handles transient failures with intelligent retry strategies
 */

export interface RetryConfig {
  maxAttempts: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
  jitter: boolean
  retryableErrors?: string[]
  onRetry?: (attempt: number, error: any) => void
}

export interface RetryStats {
  totalAttempts: number
  successfulAttempts: number
  failedAttempts: number
  averageAttempts: number
  lastError?: any
}

export class RetryError extends Error {
  constructor(
    message: string,
    public attempts: number,
    public lastError: any
  ) {
    super(message)
    this.name = 'RetryError'
  }
}

export class RetryManager {
  private stats = new Map<string, RetryStats>()

  async execute<T>(
    operation: () => Promise<T>,
    config: RetryConfig,
    operationName?: string
  ): Promise<T> {
    let lastError: any
    let attempt = 0

    while (attempt < config.maxAttempts) {
      attempt++

      try {
        const result = await operation()
        this.recordSuccess(operationName, attempt)
        return result
      } catch (error) {
        lastError = error
        
        // Check if error is retryable
        if (!this.isRetryableError(error, config)) {
          this.recordFailure(operationName, attempt, error)
          throw error
        }

        // Don't wait after the last attempt
        if (attempt >= config.maxAttempts) {
          break
        }

        // Calculate delay
        const delay = this.calculateDelay(attempt, config)
        
        // Call retry callback if provided
        if (config.onRetry) {
          config.onRetry(attempt, error)
        }

        console.warn(`Retry attempt ${attempt}/${config.maxAttempts} for ${operationName || 'operation'} after ${delay}ms. Error: ${error.message}`)

        // Wait before retry
        await this.sleep(delay)
      }
    }

    this.recordFailure(operationName, attempt, lastError)
    throw new RetryError(
      `Operation failed after ${attempt} attempts`,
      attempt,
      lastError
    )
  }

  private calculateDelay(attempt: number, config: RetryConfig): number {
    // Exponential backoff: baseDelay * (backoffMultiplier ^ (attempt - 1))
    let delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1)
    
    // Cap at maxDelay
    delay = Math.min(delay, config.maxDelay)
    
    // Add jitter to prevent thundering herd
    if (config.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5)
    }
    
    return Math.floor(delay)
  }

  private isRetryableError(error: any, config: RetryConfig): boolean {
    // If specific retryable errors are defined, check against them
    if (config.retryableErrors) {
      const errorMessage = error?.message || error?.toString() || ''
      return config.retryableErrors.some(retryable => 
        errorMessage.includes(retryable)
      )
    }

    // Default retryable conditions
    if (error?.code) {
      const retryableCodes = [
        'ECONNRESET',
        'ECONNREFUSED', 
        'ETIMEDOUT',
        'ENOTFOUND',
        'EAI_AGAIN'
      ]
      if (retryableCodes.includes(error.code)) {
        return true
      }
    }

    // HTTP status codes that are retryable
    if (error?.status || error?.statusCode) {
      const status = error.status || error.statusCode
      const retryableStatuses = [408, 429, 500, 502, 503, 504]
      return retryableStatuses.includes(status)
    }

    // Database connection errors
    const errorMessage = error?.message || ''
    const retryableMessages = [
      'connection timeout',
      'connection refused',
      'connection reset',
      'temporary failure',
      'service unavailable'
    ]
    
    return retryableMessages.some(msg => 
      errorMessage.toLowerCase().includes(msg)
    )
  }

  private recordSuccess(operationName?: string, attempts?: number) {
    if (!operationName) return

    const stats = this.getOrCreateStats(operationName)
    stats.successfulAttempts++
    stats.totalAttempts += attempts || 1
    stats.averageAttempts = stats.totalAttempts / (stats.successfulAttempts + stats.failedAttempts)
  }

  private recordFailure(operationName?: string, attempts?: number, error?: any) {
    if (!operationName) return

    const stats = this.getOrCreateStats(operationName)
    stats.failedAttempts++
    stats.totalAttempts += attempts || 1
    stats.lastError = error
    stats.averageAttempts = stats.totalAttempts / (stats.successfulAttempts + stats.failedAttempts)
  }

  private getOrCreateStats(operationName: string): RetryStats {
    if (!this.stats.has(operationName)) {
      this.stats.set(operationName, {
        totalAttempts: 0,
        successfulAttempts: 0,
        failedAttempts: 0,
        averageAttempts: 0
      })
    }
    return this.stats.get(operationName)!
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  getStats(operationName?: string): RetryStats | Record<string, RetryStats> {
    if (operationName) {
      return this.stats.get(operationName) || {
        totalAttempts: 0,
        successfulAttempts: 0,
        failedAttempts: 0,
        averageAttempts: 0
      }
    }

    const allStats: Record<string, RetryStats> = {}
    for (const [name, stats] of this.stats) {
      allStats[name] = { ...stats }
    }
    return allStats
  }

  clearStats(operationName?: string) {
    if (operationName) {
      this.stats.delete(operationName)
    } else {
      this.stats.clear()
    }
  }
}

// Global retry manager instance
export const retryManager = new RetryManager()

// Pre-configured retry strategies
export const databaseRetryConfig: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  jitter: true,
  retryableErrors: ['connection timeout', 'connection refused', 'connection reset'],
  onRetry: (attempt, error) => {
    console.warn(`Database operation retry ${attempt}: ${error.message}`)
  }
}

export const redisRetryConfig: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 500,
  maxDelay: 5000,
  backoffMultiplier: 2,
  jitter: true,
  retryableErrors: ['connection timeout', 'connection refused'],
  onRetry: (attempt, error) => {
    console.warn(`Redis operation retry ${attempt}: ${error.message}`)
  }
}

export const emailRetryConfig: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 2000,
  maxDelay: 30000,
  backoffMultiplier: 3,
  jitter: true,
  retryableErrors: ['timeout', 'temporary failure', 'rate limit'],
  onRetry: (attempt, error) => {
    console.warn(`Email operation retry ${attempt}: ${error.message}`)
  }
}

export const httpRetryConfig: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 15000,
  backoffMultiplier: 2,
  jitter: true,
  onRetry: (attempt, error) => {
    console.warn(`HTTP operation retry ${attempt}: ${error.message}`)
  }
}

// Utility functions
export function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig,
  operationName?: string
): Promise<T> {
  return retryManager.execute(operation, config, operationName)
}

export function withDatabaseRetry<T>(
  operation: () => Promise<T>,
  operationName?: string
): Promise<T> {
  return retryManager.execute(operation, databaseRetryConfig, operationName)
}

export function withRedisRetry<T>(
  operation: () => Promise<T>,
  operationName?: string
): Promise<T> {
  return retryManager.execute(operation, redisRetryConfig, operationName)
}

export function withEmailRetry<T>(
  operation: () => Promise<T>,
  operationName?: string
): Promise<T> {
  return retryManager.execute(operation, emailRetryConfig, operationName)
}

export function withHttpRetry<T>(
  operation: () => Promise<T>,
  config?: Partial<RetryConfig>,
  operationName?: string
): Promise<T> {
  const finalConfig = { ...httpRetryConfig, ...config }
  return retryManager.execute(operation, finalConfig, operationName)
}