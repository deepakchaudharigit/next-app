/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascading failures by temporarily disabling failing services
 */

export interface CircuitBreakerConfig {
  failureThreshold: number
  recoveryTimeout: number
  monitoringPeriod: number
  expectedErrors?: string[]
}

export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Failing, requests rejected
  HALF_OPEN = 'HALF_OPEN' // Testing if service recovered
}

export interface CircuitBreakerStats {
  state: CircuitState
  failureCount: number
  successCount: number
  lastFailureTime?: Date
  lastSuccessTime?: Date
  nextAttemptTime?: Date
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED
  private failureCount = 0
  private successCount = 0
  private lastFailureTime?: Date
  private lastSuccessTime?: Date
  private nextAttemptTime?: Date
  
  constructor(
    private name: string,
    private config: CircuitBreakerConfig
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitState.HALF_OPEN
        console.log(`🔄 Circuit breaker ${this.name} entering HALF_OPEN state`)
      } else {
        throw new Error(`Circuit breaker ${this.name} is OPEN. Next attempt at ${this.nextAttemptTime}`)
      }
    }

    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure(error)
      throw error
    }
  }

  private onSuccess() {
    this.successCount++
    this.lastSuccessTime = new Date()
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.reset()
      console.log(`✅ Circuit breaker ${this.name} reset to CLOSED state`)
    }
  }

  private onFailure(error: any) {
    // Check if this is an expected error that shouldn't trigger circuit breaker
    if (this.isExpectedError(error)) {
      return
    }

    this.failureCount++
    this.lastFailureTime = new Date()

    if (this.state === CircuitState.HALF_OPEN) {
      this.trip()
      console.log(`❌ Circuit breaker ${this.name} failed in HALF_OPEN, returning to OPEN`)
    } else if (this.failureCount >= this.config.failureThreshold) {
      this.trip()
      console.log(`🚨 Circuit breaker ${this.name} tripped after ${this.failureCount} failures`)
    }
  }

  private trip() {
    this.state = CircuitState.OPEN
    this.nextAttemptTime = new Date(Date.now() + this.config.recoveryTimeout)
  }

  private reset() {
    this.state = CircuitState.CLOSED
    this.failureCount = 0
    this.nextAttemptTime = undefined
  }

  private shouldAttemptReset(): boolean {
    return this.nextAttemptTime ? new Date() >= this.nextAttemptTime : false
  }

  private isExpectedError(error: any): boolean {
    if (!this.config.expectedErrors) return false
    
    const errorMessage = error?.message || error?.toString() || ''
    return this.config.expectedErrors.some(expected => 
      errorMessage.includes(expected)
    )
  }

  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      nextAttemptTime: this.nextAttemptTime
    }
  }

  // Manual controls
  forceOpen() {
    this.state = CircuitState.OPEN
    this.nextAttemptTime = new Date(Date.now() + this.config.recoveryTimeout)
    console.log(`🔒 Circuit breaker ${this.name} manually opened`)
  }

  forceClose() {
    this.reset()
    console.log(`🔓 Circuit breaker ${this.name} manually closed`)
  }
}

// Circuit breaker registry
class CircuitBreakerRegistry {
  private breakers = new Map<string, CircuitBreaker>()

  getOrCreate(name: string, config: CircuitBreakerConfig): CircuitBreaker {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker(name, config))
    }
    return this.breakers.get(name)!
  }

  get(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name)
  }

  getAll(): Map<string, CircuitBreaker> {
    return new Map(this.breakers)
  }

  getAllStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {}
    for (const [name, breaker] of this.breakers) {
      stats[name] = breaker.getStats()
    }
    return stats
  }
}

export const circuitBreakerRegistry = new CircuitBreakerRegistry()

// Pre-configured circuit breakers for common services
export const databaseCircuitBreaker = circuitBreakerRegistry.getOrCreate('database', {
  failureThreshold: 5,
  recoveryTimeout: 30000, // 30 seconds
  monitoringPeriod: 60000, // 1 minute
  expectedErrors: ['Connection timeout', 'ECONNREFUSED']
})

export const redisCircuitBreaker = circuitBreakerRegistry.getOrCreate('redis', {
  failureThreshold: 3,
  recoveryTimeout: 15000, // 15 seconds
  monitoringPeriod: 30000, // 30 seconds
  expectedErrors: ['Connection timeout', 'ECONNREFUSED']
})

export const emailCircuitBreaker = circuitBreakerRegistry.getOrCreate('email', {
  failureThreshold: 3,
  recoveryTimeout: 60000, // 1 minute
  monitoringPeriod: 300000, // 5 minutes
  expectedErrors: ['SMTP timeout', 'Authentication failed']
})

// Utility function to wrap operations with circuit breaker
export function withCircuitBreaker<T>(
  name: string,
  operation: () => Promise<T>,
  config?: CircuitBreakerConfig
): Promise<T> {
  const defaultConfig: CircuitBreakerConfig = {
    failureThreshold: 5,
    recoveryTimeout: 30000,
    monitoringPeriod: 60000
  }
  
  const breaker = circuitBreakerRegistry.getOrCreate(name, config || defaultConfig)
  return breaker.execute(operation)
}