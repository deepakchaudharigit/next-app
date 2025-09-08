/**
 * Enhanced Error Handling System
 * Provides comprehensive error handling, logging, and recovery mechanisms
 */

import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'
import { alertManager } from '@/lib/monitoring/alerts'

export interface ErrorContext {
  requestId: string
  userId?: string
  userAgent?: string
  ipAddress?: string
  route: string
  method: string
  timestamp: Date
  stack?: string
}

export interface ErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: any
    requestId: string
    timestamp: string
  }
  stack?: string
}

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public isOperational: boolean = true,
    public details?: any
  ) {
    super(message)
    this.name = 'AppError'
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', true, details)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR', true)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR', true)
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND_ERROR', true)
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409, 'CONFLICT_ERROR', true)
    this.name = 'ConflictError'
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_ERROR', true)
    this.name = 'RateLimitError'
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, originalError?: any) {
    super(`External service error: ${service}`, 502, 'EXTERNAL_SERVICE_ERROR', true, originalError)
    this.name = 'ExternalServiceError'
  }
}

class ErrorHandler {
  private errorCounts = new Map<string, number>()
  private lastErrors = new Map<string, Date>()

  // Main error handling function
  handleError(error: any, context: ErrorContext): ErrorResponse {
    // Generate request ID if not provided
    if (!context.requestId) {
      context.requestId = this.generateRequestId()
    }

    // Log error
    this.logError(error, context)

    // Track error for monitoring
    this.trackError(error, context)

    // Check if we should alert
    this.checkForAlerting(error, context)

    // Convert to standardized error response
    return this.createErrorResponse(error, context)
  }

  // Handle API route errors
  handleApiError(error: any, req: NextRequest): NextResponse {
    const context: ErrorContext = {
      requestId: this.generateRequestId(),
      route: req.nextUrl.pathname,
      method: req.method,
      timestamp: new Date(),
      userAgent: req.headers.get('user-agent') || undefined,
      ipAddress: this.getClientIP(req),
      userId: req.headers.get('x-user-id') || undefined
    }

    const errorResponse = this.handleError(error, context)
    
    return NextResponse.json(errorResponse, { 
      status: this.getStatusCode(error),
      headers: {
        'X-Request-ID': context.requestId,
        'X-Error-Code': errorResponse.error.code
      }
    })
  }

  private logError(error: any, context: ErrorContext) {
    const logData = {
      requestId: context.requestId,
      error: {
        name: error.name,
        message: error.message,
        code: error.code || 'UNKNOWN',
        stack: error.stack
      },
      context: {
        route: context.route,
        method: context.method,
        userId: context.userId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
      },
      timestamp: context.timestamp.toISOString()
    }

    // Log based on severity
    if (this.isCriticalError(error)) {
      console.error('🔥 CRITICAL ERROR:', JSON.stringify(logData, null, 2))
    } else if (this.isOperationalError(error)) {
      console.warn('⚠️ OPERATIONAL ERROR:', JSON.stringify(logData, null, 2))
    } else {
      console.error('❌ ERROR:', JSON.stringify(logData, null, 2))
    }
  }

  private trackError(error: any, context: ErrorContext) {
    const errorKey = `${context.route}:${error.name || 'Unknown'}`
    
    // Increment error count
    const currentCount = this.errorCounts.get(errorKey) || 0
    this.errorCounts.set(errorKey, currentCount + 1)
    
    // Update last error time
    this.lastErrors.set(errorKey, new Date())
  }

  private checkForAlerting(error: any, context: ErrorContext) {
    // Alert on critical errors immediately
    if (this.isCriticalError(error)) {
      alertManager['alerts'].push({
        id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        severity: 'critical',
        title: 'Critical Application Error',
        message: `${error.name}: ${error.message} at ${context.route}`,
        timestamp: new Date(),
        source: 'error_handler',
        tags: {
          route: context.route,
          errorType: error.name,
          userId: context.userId || 'anonymous'
        },
        resolved: false
      })
    }

    // Alert on high error rates
    const errorKey = `${context.route}:${error.name || 'Unknown'}`
    const errorCount = this.errorCounts.get(errorKey) || 0
    
    if (errorCount > 10) {
      const lastAlert = this.lastErrors.get(`alert:${errorKey}`)
      const now = new Date()
      
      // Only alert once per hour for the same error type
      if (!lastAlert || now.getTime() - lastAlert.getTime() > 60 * 60 * 1000) {
        alertManager['alerts'].push({
          id: `error_rate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          severity: 'high',
          title: 'High Error Rate Detected',
          message: `${errorCount} occurrences of ${error.name} at ${context.route}`,
          timestamp: new Date(),
          source: 'error_handler',
          tags: {
            route: context.route,
            errorType: error.name,
            count: errorCount.toString()
          },
          resolved: false
        })
        
        this.lastErrors.set(`alert:${errorKey}`, now)
      }
    }
  }

  private createErrorResponse(error: any, context: ErrorContext): ErrorResponse {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: this.getErrorCode(error),
        message: this.getErrorMessage(error),
        requestId: context.requestId,
        timestamp: context.timestamp.toISOString()
      }
    }

    // Add details for validation errors
    if (error instanceof ZodError) {
      response.error.details = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }))
    } else if (error.details) {
      response.error.details = error.details
    }

    // Add stack trace in development
    if (process.env.NODE_ENV === 'development' && error.stack) {
      response.stack = error.stack
    }

    return response
  }

  private getStatusCode(error: any): number {
    if (error.statusCode) return error.statusCode
    if (error instanceof ZodError) return 400
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002': return 409 // Unique constraint violation
        case 'P2025': return 404 // Record not found
        default: return 400
      }
    }
    return 500
  }

  private getErrorCode(error: any): string {
    if (error.code) return error.code
    if (error instanceof ZodError) return 'VALIDATION_ERROR'
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return `DATABASE_ERROR_${error.code}`
    }
    return 'INTERNAL_ERROR'
  }

  private getErrorMessage(error: any): string {
    // Don't expose internal error details in production
    if (process.env.NODE_ENV === 'production' && !this.isOperationalError(error)) {
      return 'An internal error occurred'
    }

    if (error instanceof ZodError) {
      return 'Validation failed'
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          return 'A record with this information already exists'
        case 'P2025':
          return 'The requested record was not found'
        default:
          return 'Database operation failed'
      }
    }

    return error.message || 'An unknown error occurred'
  }

  private isOperationalError(error: any): boolean {
    if (error.isOperational !== undefined) {
      return error.isOperational
    }

    // Consider these as operational (expected) errors
    return (
      error instanceof ZodError ||
      error instanceof AppError ||
      error instanceof Prisma.PrismaClientKnownRequestError
    )
  }

  private isCriticalError(error: any): boolean {
    // Database connection errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return true
    }

    // Out of memory errors
    if (error.message?.includes('out of memory')) {
      return true
    }

    // Security-related errors
    if (error.name === 'SecurityError' || error.message?.includes('security')) {
      return true
    }

    return false
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getClientIP(req: NextRequest): string {
    return (
      req.headers.get('x-forwarded-for')?.split(',')[0] ||
      req.headers.get('x-real-ip') ||
      req.headers.get('cf-connecting-ip') ||
      'unknown'
    )
  }

  // Get error statistics
  getErrorStats(): Record<string, { count: number; lastOccurrence: Date }> {
    const stats: Record<string, { count: number; lastOccurrence: Date }> = {}
    
    for (const [key, count] of this.errorCounts) {
      const lastOccurrence = this.lastErrors.get(key)
      if (lastOccurrence) {
        stats[key] = { count, lastOccurrence }
      }
    }
    
    return stats
  }

  // Clear error statistics
  clearStats() {
    this.errorCounts.clear()
    this.lastErrors.clear()
  }
}

// Global error handler instance
export const errorHandler = new ErrorHandler()

// Utility functions for API routes
export function withErrorHandling<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args)
    } catch (error) {
      const req = args[0] as NextRequest
      return errorHandler.handleApiError(error, req)
    }
  }
}

// Global error handlers for unhandled errors
if (typeof window === 'undefined') {
  process.on('uncaughtException', (error) => {
    console.error('🔥 Uncaught Exception:', error)
    errorHandler.handleError(error, {
      requestId: 'uncaught',
      route: 'process',
      method: 'UNCAUGHT',
      timestamp: new Date()
    })
    
    // Give time for logging then exit
    setTimeout(() => process.exit(1), 1000)
  })

  process.on('unhandledRejection', (reason, promise) => {
    console.error('🔥 Unhandled Rejection at:', promise, 'reason:', reason)
    errorHandler.handleError(reason, {
      requestId: 'unhandled',
      route: 'process',
      method: 'UNHANDLED',
      timestamp: new Date()
    })
  })
}