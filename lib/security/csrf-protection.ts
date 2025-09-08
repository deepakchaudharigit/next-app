/**
 * CSRF Protection Implementation
 * Prevents Cross-Site Request Forgery attacks with token-based validation
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { advancedCache } from '@/lib/cache/advanced-cache'

interface CSRFConfig {
  tokenLength: number
  cookieName: string
  headerName: string
  tokenTTL: number
  sameSite: 'strict' | 'lax' | 'none'
  secure: boolean
  httpOnly: boolean
  ignoreMethods: string[]
  trustedOrigins: string[]
}

interface CSRFToken {
  token: string
  sessionId: string
  createdAt: number
  userAgent?: string
  ipAddress?: string
}

export class CSRFProtection {
  private config: CSRFConfig

  constructor(config?: Partial<CSRFConfig>) {
    this.config = {
      tokenLength: 32,
      cookieName: 'csrf-token',
      headerName: 'x-csrf-token',
      tokenTTL: 24 * 60 * 60, // 24 hours
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: false, // Must be false so JavaScript can read it
      ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
      trustedOrigins: [
        process.env.NEXTAUTH_URL || 'http://localhost:3000',
        process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      ],
      ...config
    }
  }

  // Generate CSRF token
  generateToken(sessionId: string, userAgent?: string, ipAddress?: string): string {
    const token = crypto.randomBytes(this.config.tokenLength).toString('hex')
    
    const csrfData: CSRFToken = {
      token,
      sessionId,
      createdAt: Date.now(),
      userAgent,
      ipAddress
    }

    // Store token in cache
    advancedCache.set(`csrf:${token}`, csrfData, {
      ttl: this.config.tokenTTL,
      tags: ['csrf', `session:${sessionId}`]
    })

    return token
  }

  // Validate CSRF token
  async validateToken(
    token: string,
    sessionId: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<{ valid: boolean; reason?: string }> {
    if (!token) {
      return { valid: false, reason: 'Missing CSRF token' }
    }

    // Get token data from cache
    const csrfData = await advancedCache.get<CSRFToken>(`csrf:${token}`)
    
    if (!csrfData) {
      return { valid: false, reason: 'Invalid or expired CSRF token' }
    }

    // Validate session ID
    if (csrfData.sessionId !== sessionId) {
      return { valid: false, reason: 'CSRF token session mismatch' }
    }

    // Check if token is expired
    if (Date.now() - csrfData.createdAt > this.config.tokenTTL * 1000) {
      await this.invalidateToken(token)
      return { valid: false, reason: 'CSRF token expired' }
    }

    // Optional: Validate user agent (helps prevent token theft)
    if (csrfData.userAgent && userAgent && csrfData.userAgent !== userAgent) {
      console.warn('🚨 CSRF token user agent mismatch', {
        stored: csrfData.userAgent,
        received: userAgent
      })
      // Don't fail validation for user agent mismatch, just log it
    }

    // Optional: Validate IP address (strict security)
    if (process.env.CSRF_STRICT_IP === 'true' && csrfData.ipAddress && ipAddress) {
      if (csrfData.ipAddress !== ipAddress) {
        return { valid: false, reason: 'CSRF token IP address mismatch' }
      }
    }

    return { valid: true }
  }

  // Invalidate CSRF token
  async invalidateToken(token: string): Promise<void> {
    await advancedCache.invalidateByPattern(`csrf:${token}`)
  }

  // Invalidate all tokens for a session
  async invalidateSessionTokens(sessionId: string): Promise<void> {
    await advancedCache.invalidateByTags([`session:${sessionId}`])
  }

  // Check if origin is trusted
  private isTrustedOrigin(origin: string): boolean {
    if (!origin) return false
    
    return this.config.trustedOrigins.some(trusted => {
      // Exact match
      if (trusted === origin) return true
      
      // Wildcard subdomain match
      if (trusted.startsWith('*.')) {
        const domain = trusted.slice(2)
        return origin.endsWith(domain)
      }
      
      return false
    })
  }

  // Validate origin header
  private validateOrigin(req: NextRequest): { valid: boolean; reason?: string } {
    const origin = req.headers.get('origin')
    const referer = req.headers.get('referer')
    
    // For same-origin requests, origin might be null
    if (!origin && !referer) {
      return { valid: false, reason: 'Missing origin and referer headers' }
    }

    // Check origin if present
    if (origin && !this.isTrustedOrigin(origin)) {
      return { valid: false, reason: `Untrusted origin: ${origin}` }
    }

    // Check referer if origin is missing
    if (!origin && referer) {
      try {
        const refererUrl = new URL(referer)
        const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`
        
        if (!this.isTrustedOrigin(refererOrigin)) {
          return { valid: false, reason: `Untrusted referer: ${refererOrigin}` }
        }
      } catch (error) {
        return { valid: false, reason: 'Invalid referer header' }
      }
    }

    return { valid: true }
  }

  // Get session ID from request
  private getSessionId(req: NextRequest): string | null {
    // Try to get session ID from NextAuth cookie
    const sessionToken = req.cookies.get('next-auth.session-token')?.value ||
                         req.cookies.get('__Secure-next-auth.session-token')?.value

    if (sessionToken) {
      return sessionToken
    }

    // Fallback to custom session ID
    return req.cookies.get('session-id')?.value || null
  }

  // Get client info
  private getClientInfo(req: NextRequest) {
    return {
      userAgent: req.headers.get('user-agent') || undefined,
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                 req.headers.get('x-real-ip') ||
                 req.headers.get('cf-connecting-ip') ||
                 'unknown'
    }
  }

  // Middleware function to protect routes
  async protect(req: NextRequest): Promise<NextResponse | null> {
    const method = req.method.toUpperCase()
    
    // Skip CSRF protection for safe methods
    if (this.config.ignoreMethods.includes(method)) {
      return null
    }

    // Validate origin/referer
    const originValidation = this.validateOrigin(req)
    if (!originValidation.valid) {
      console.warn('🚨 CSRF protection: Origin validation failed', {
        reason: originValidation.reason,
        url: req.url,
        method: req.method
      })

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CSRF_ORIGIN_INVALID',
            message: 'Request origin validation failed'
          }
        },
        { status: 403 }
      )
    }

    // Get session ID
    const sessionId = this.getSessionId(req)
    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CSRF_NO_SESSION',
            message: 'No valid session found'
          }
        },
        { status: 403 }
      )
    }

    // Get CSRF token from header or body
    let token = req.headers.get(this.config.headerName)
    
    if (!token && req.headers.get('content-type')?.includes('application/json')) {
      try {
        const body = await req.clone().json()
        token = body.csrfToken || body._token
      } catch (error) {
        // Ignore JSON parsing errors
      }
    }

    if (!token && req.headers.get('content-type')?.includes('application/x-www-form-urlencoded')) {
      try {
        const formData = await req.clone().formData()
        token = formData.get('csrfToken')?.toString() || formData.get('_token')?.toString()
      } catch (error) {
        // Ignore form parsing errors
      }
    }

    // Validate CSRF token
    const { userAgent, ipAddress } = this.getClientInfo(req)
    const validation = await this.validateToken(token || '', sessionId, userAgent, ipAddress)

    if (!validation.valid) {
      console.warn('🚨 CSRF protection: Token validation failed', {
        reason: validation.reason,
        url: req.url,
        method: req.method,
        sessionId: sessionId.substring(0, 8) + '...',
        userAgent,
        ipAddress
      })

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CSRF_TOKEN_INVALID',
            message: 'CSRF token validation failed'
          }
        },
        { status: 403 }
      )
    }

    return null
  }

  // Generate token for client
  async generateTokenForClient(req: NextRequest): Promise<{ token: string; cookie: string }> {
    const sessionId = this.getSessionId(req) || crypto.randomUUID()
    const { userAgent, ipAddress } = this.getClientInfo(req)
    
    const token = this.generateToken(sessionId, userAgent, ipAddress)
    
    // Create cookie string
    const cookieOptions = [
      `${this.config.cookieName}=${token}`,
      `Max-Age=${this.config.tokenTTL}`,
      `SameSite=${this.config.sameSite}`,
      'Path=/'
    ]

    if (this.config.secure) {
      cookieOptions.push('Secure')
    }

    if (this.config.httpOnly) {
      cookieOptions.push('HttpOnly')
    }

    return {
      token,
      cookie: cookieOptions.join('; ')
    }
  }

  // Get configuration
  getConfig(): CSRFConfig {
    return { ...this.config }
  }

  // Update trusted origins
  addTrustedOrigin(origin: string) {
    if (!this.config.trustedOrigins.includes(origin)) {
      this.config.trustedOrigins.push(origin)
      console.log(`✅ Added trusted origin: ${origin}`)
    }
  }

  removeTrustedOrigin(origin: string) {
    const index = this.config.trustedOrigins.indexOf(origin)
    if (index > -1) {
      this.config.trustedOrigins.splice(index, 1)
      console.log(`❌ Removed trusted origin: ${origin}`)
    }
  }
}

// Global CSRF protection instance
export const csrfProtection = new CSRFProtection()

// Utility functions
export async function withCSRFProtection(req: NextRequest): Promise<NextResponse | null> {
  return csrfProtection.protect(req)
}

export async function generateCSRFToken(req: NextRequest): Promise<{ token: string; cookie: string }> {
  return csrfProtection.generateTokenForClient(req)
}

export async function validateCSRFToken(
  token: string,
  sessionId: string,
  userAgent?: string,
  ipAddress?: string
): Promise<{ valid: boolean; reason?: string }> {
  return csrfProtection.validateToken(token, sessionId, userAgent, ipAddress)
}