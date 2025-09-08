/**
 * SQL Injection Prevention System
 * Multi-layer protection against SQL injection attacks beyond Prisma
 */

import { z } from 'zod'
import { alertManager } from '@/lib/monitoring/alerts'

interface SQLInjectionPattern {
  pattern: RegExp
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
}

interface ValidationResult {
  isValid: boolean
  threats: Array<{
    pattern: string
    severity: string
    description: string
    matchedText: string
  }>
  sanitizedValue?: any
}

export class SQLInjectionPrevention {
  private static instance: SQLInjectionPrevention
  private suspiciousPatterns: SQLInjectionPattern[] = []
  private blockedAttempts = new Map<string, number>()

  static getInstance(): SQLInjectionPrevention {
    if (!SQLInjectionPrevention.instance) {
      SQLInjectionPrevention.instance = new SQLInjectionPrevention()
    }
    return SQLInjectionPrevention.instance
  }

  constructor() {
    this.initializePatterns()
  }

  private initializePatterns() {
    this.suspiciousPatterns = [
      // SQL Keywords and Commands
      {
        pattern: /\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|HAVING|WHERE|ORDER\s+BY|GROUP\s+BY)\b/gi,
        severity: 'high',
        description: 'SQL keywords detected'
      },
      
      // SQL Injection Techniques
      {
        pattern: /(\'\s*(OR|AND)\s*\'\s*=\s*\')|(\'\s*(OR|AND)\s*1\s*=\s*1)|(\'\s*(OR|AND)\s*\d+\s*=\s*\d+)/gi,
        severity: 'critical',
        description: 'Classic SQL injection pattern (OR/AND conditions)'
      },
      
      // Comment-based injection
      {
        pattern: /(--|\#|\/\*|\*\/)/g,
        severity: 'high',
        description: 'SQL comment characters detected'
      },
      
      // Union-based injection
      {
        pattern: /\bUNION\s+(ALL\s+)?SELECT\b/gi,
        severity: 'critical',
        description: 'UNION SELECT injection attempt'
      },
      
      // Time-based blind injection
      {
        pattern: /\b(SLEEP|WAITFOR|DELAY|BENCHMARK)\s*\(/gi,
        severity: 'critical',
        description: 'Time-based SQL injection functions'
      },
      
      // Boolean-based blind injection
      {
        pattern: /\b(IF|CASE|WHEN|THEN|ELSE|END)\b.*\b(SELECT|UPDATE|DELETE|INSERT)\b/gi,
        severity: 'high',
        description: 'Conditional SQL injection pattern'
      },
      
      // Error-based injection
      {
        pattern: /\b(CAST|CONVERT|EXTRACTVALUE|UPDATEXML|EXP|FLOOR|RAND)\s*\(/gi,
        severity: 'medium',
        description: 'Error-based SQL injection functions'
      },
      
      // Stacked queries
      {
        pattern: /;\s*(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)/gi,
        severity: 'critical',
        description: 'Stacked query injection attempt'
      },
      
      // Information schema access
      {
        pattern: /\b(INFORMATION_SCHEMA|SYSOBJECTS|SYSCOLUMNS|SYSTABLES)\b/gi,
        severity: 'high',
        description: 'Database metadata access attempt'
      },
      
      // Database-specific functions
      {
        pattern: /\b(VERSION|USER|DATABASE|SCHEMA|CURRENT_USER|SYSTEM_USER)\s*\(/gi,
        severity: 'medium',
        description: 'Database information functions'
      },
      
      // Hex encoding attempts
      {
        pattern: /0x[0-9a-fA-F]+/g,
        severity: 'medium',
        description: 'Hexadecimal encoding detected'
      },
      
      // Char/ASCII functions
      {
        pattern: /\b(CHAR|ASCII|ORD|HEX|UNHEX)\s*\(/gi,
        severity: 'medium',
        description: 'Character manipulation functions'
      },
      
      // Substring and string functions
      {
        pattern: /\b(SUBSTRING|SUBSTR|MID|LEFT|RIGHT|CONCAT)\s*\(/gi,
        severity: 'low',
        description: 'String manipulation functions (potential data extraction)'
      },
      
      // Load file attempts
      {
        pattern: /\b(LOAD_FILE|INTO\s+OUTFILE|INTO\s+DUMPFILE)\b/gi,
        severity: 'critical',
        description: 'File system access attempt'
      },
      
      // XPath injection
      {
        pattern: /\b(EXTRACTVALUE|UPDATEXML)\s*\(/gi,
        severity: 'high',
        description: 'XPath injection functions'
      }
    ]
  }

  // Validate input for SQL injection patterns
  validateInput(input: any, context: string = 'unknown'): ValidationResult {
    if (typeof input !== 'string') {
      return { isValid: true, threats: [] }
    }

    const threats: ValidationResult['threats'] = []
    
    for (const pattern of this.suspiciousPatterns) {
      const matches = input.match(pattern.pattern)
      if (matches) {
        threats.push({
          pattern: pattern.pattern.toString(),
          severity: pattern.severity,
          description: pattern.description,
          matchedText: matches[0]
        })
      }
    }

    const isValid = threats.length === 0 || !threats.some(t => t.severity === 'critical')
    
    if (!isValid) {
      this.logSQLInjectionAttempt(input, threats, context)
    }

    return {
      isValid,
      threats,
      sanitizedValue: isValid ? input : this.sanitizeInput(input)
    }
  }

  // Sanitize input by removing/escaping dangerous patterns
  private sanitizeInput(input: string): string {
    let sanitized = input

    // Remove SQL comments
    sanitized = sanitized.replace(/(--|\#|\/\*.*?\*\/)/g, '')
    
    // Escape single quotes
    sanitized = sanitized.replace(/'/g, "''")
    
    // Remove semicolons (prevent stacked queries)
    sanitized = sanitized.replace(/;/g, '')
    
    // Remove or escape dangerous keywords
    const dangerousKeywords = [
      'UNION', 'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER',
      'EXEC', 'EXECUTE', 'SCRIPT', 'JAVASCRIPT', 'VBSCRIPT'
    ]
    
    for (const keyword of dangerousKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
      sanitized = sanitized.replace(regex, `[${keyword}]`)
    }

    return sanitized.trim()
  }

  // Log SQL injection attempts
  private logSQLInjectionAttempt(
    input: string,
    threats: ValidationResult['threats'],
    context: string
  ) {
    const criticalThreats = threats.filter(t => t.severity === 'critical')
    const highThreats = threats.filter(t => t.severity === 'high')
    
    console.warn('🚨 SQL Injection attempt detected:', {
      context,
      input: input.substring(0, 200) + (input.length > 200 ? '...' : ''),
      threats: threats.map(t => ({ severity: t.severity, description: t.description }))
    })

    // Alert on critical threats
    if (criticalThreats.length > 0) {
      alertManager['alerts'].push({
        id: `sql_injection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        severity: 'critical',
        title: 'SQL Injection Attack Detected',
        message: `Critical SQL injection patterns detected in ${context}: ${criticalThreats.map(t => t.description).join(', ')}`,
        timestamp: new Date(),
        source: 'sql_injection_prevention',
        tags: {
          context,
          threatCount: threats.length.toString(),
          criticalThreats: criticalThreats.length.toString()
        },
        resolved: false
      })
    } else if (highThreats.length > 0) {
      alertManager['alerts'].push({
        id: `sql_injection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        severity: 'high',
        title: 'Suspicious SQL Pattern Detected',
        message: `High-risk SQL patterns detected in ${context}: ${highThreats.map(t => t.description).join(', ')}`,
        timestamp: new Date(),
        source: 'sql_injection_prevention',
        tags: {
          context,
          threatCount: threats.length.toString()
        },
        resolved: false
      })
    }
  }

  // Validate and sanitize object properties
  validateObject(obj: Record<string, any>, context: string = 'object'): {
    isValid: boolean
    sanitizedObject: Record<string, any>
    threats: Array<{ field: string; threats: ValidationResult['threats'] }>
  } {
    const sanitizedObject: Record<string, any> = {}
    const allThreats: Array<{ field: string; threats: ValidationResult['threats'] }> = []
    let isValid = true

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        const validation = this.validateInput(value, `${context}.${key}`)
        sanitizedObject[key] = validation.sanitizedValue || value
        
        if (!validation.isValid) {
          isValid = false
          allThreats.push({ field: key, threats: validation.threats })
        }
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const nestedValidation = this.validateObject(value, `${context}.${key}`)
        sanitizedObject[key] = nestedValidation.sanitizedObject
        
        if (!nestedValidation.isValid) {
          isValid = false
          allThreats.push(...nestedValidation.threats.map(t => ({
            field: `${key}.${t.field}`,
            threats: t.threats
          })))
        }
      } else if (Array.isArray(value)) {
        sanitizedObject[key] = value.map((item, index) => {
          if (typeof item === 'string') {
            const validation = this.validateInput(item, `${context}.${key}[${index}]`)
            if (!validation.isValid) {
              isValid = false
              allThreats.push({ field: `${key}[${index}]`, threats: validation.threats })
            }
            return validation.sanitizedValue || item
          }
          return item
        })
      } else {
        sanitizedObject[key] = value
      }
    }

    return { isValid, sanitizedObject, threats: allThreats }
  }

  // Create Zod schema with SQL injection validation
  createSecureSchema<T extends z.ZodRawShape>(shape: T): z.ZodObject<T> {
    const secureShape: any = {}

    for (const [key, schema] of Object.entries(shape)) {
      if (schema instanceof z.ZodString) {
        secureShape[key] = schema.refine(
          (value) => this.validateInput(value, key).isValid,
          {
            message: `Invalid input detected in ${key}: potential SQL injection`
          }
        )
      } else {
        secureShape[key] = schema
      }
    }

    return z.object(secureShape)
  }

  // Middleware for request validation
  validateRequest(req: any): {
    isValid: boolean
    sanitizedBody?: any
    sanitizedQuery?: any
    threats: Array<{ source: string; field: string; threats: ValidationResult['threats'] }>
  } {
    const allThreats: Array<{ source: string; field: string; threats: ValidationResult['threats'] }> = []
    let isValid = true
    let sanitizedBody: any
    let sanitizedQuery: any

    // Validate request body
    if (req.body && typeof req.body === 'object') {
      const bodyValidation = this.validateObject(req.body, 'body')
      sanitizedBody = bodyValidation.sanitizedObject
      
      if (!bodyValidation.isValid) {
        isValid = false
        allThreats.push(...bodyValidation.threats.map(t => ({
          source: 'body',
          field: t.field,
          threats: t.threats
        })))
      }
    }

    // Validate query parameters
    if (req.query && typeof req.query === 'object') {
      const queryValidation = this.validateObject(req.query, 'query')
      sanitizedQuery = queryValidation.sanitizedObject
      
      if (!queryValidation.isValid) {
        isValid = false
        allThreats.push(...queryValidation.threats.map(t => ({
          source: 'query',
          field: t.field,
          threats: t.threats
        })))
      }
    }

    return { isValid, sanitizedBody, sanitizedQuery, threats: allThreats }
  }

  // Get statistics
  getStats() {
    return {
      patternsCount: this.suspiciousPatterns.length,
      blockedAttempts: Object.fromEntries(this.blockedAttempts),
      patterns: this.suspiciousPatterns.map(p => ({
        severity: p.severity,
        description: p.description
      }))
    }
  }

  // Add custom pattern
  addPattern(pattern: RegExp, severity: SQLInjectionPattern['severity'], description: string) {
    this.suspiciousPatterns.push({ pattern, severity, description })
    console.log(`✅ Added SQL injection pattern: ${description}`)
  }

  // Remove pattern
  removePattern(description: string) {
    const index = this.suspiciousPatterns.findIndex(p => p.description === description)
    if (index > -1) {
      this.suspiciousPatterns.splice(index, 1)
      console.log(`❌ Removed SQL injection pattern: ${description}`)
    }
  }
}

// Global SQL injection prevention instance
export const sqlInjectionPrevention = SQLInjectionPrevention.getInstance()

// Utility functions
export function validateSQLInput(input: any, context?: string): ValidationResult {
  return sqlInjectionPrevention.validateInput(input, context)
}

export function validateSQLObject(obj: Record<string, any>, context?: string) {
  return sqlInjectionPrevention.validateObject(obj, context)
}

export function createSecureZodSchema<T extends z.ZodRawShape>(shape: T): z.ZodObject<T> {
  return sqlInjectionPrevention.createSecureSchema(shape)
}

export function validateRequestForSQLInjection(req: any) {
  return sqlInjectionPrevention.validateRequest(req)
}

// Enhanced Prisma wrapper with additional validation
export class SecurePrismaWrapper {
  constructor(private prisma: any) {}

  // Secure query execution with validation
  async executeQuery<T>(
    operation: string,
    args: any,
    context: string = 'query'
  ): Promise<T> {
    // Validate arguments for SQL injection
    if (args && typeof args === 'object') {
      const validation = sqlInjectionPrevention.validateObject(args, context)
      
      if (!validation.isValid) {
        const threats = validation.threats.flatMap(t => t.threats)
        const criticalThreats = threats.filter(t => t.severity === 'critical')
        
        if (criticalThreats.length > 0) {
          throw new Error(`SQL injection attempt blocked in ${context}`)
        }
        
        // Use sanitized arguments for non-critical threats
        args = validation.sanitizedObject
      }
    }

    // Execute the Prisma operation
    return await this.prisma[operation](args)
  }

  // Secure raw query execution
  async executeRawQuery<T>(query: string, values?: any[]): Promise<T> {
    // Validate the query string
    const queryValidation = sqlInjectionPrevention.validateInput(query, 'raw_query')
    
    if (!queryValidation.isValid) {
      const criticalThreats = queryValidation.threats.filter(t => t.severity === 'critical')
      
      if (criticalThreats.length > 0) {
        throw new Error('SQL injection attempt blocked in raw query')
      }
    }

    // Validate parameter values
    if (values) {
      for (let i = 0; i < values.length; i++) {
        if (typeof values[i] === 'string') {
          const validation = sqlInjectionPrevention.validateInput(values[i], `raw_query_param_${i}`)
          
          if (!validation.isValid) {
            const criticalThreats = validation.threats.filter(t => t.severity === 'critical')
            
            if (criticalThreats.length > 0) {
              throw new Error(`SQL injection attempt blocked in query parameter ${i}`)
            }
            
            // Use sanitized value
            values[i] = validation.sanitizedValue
          }
        }
      }
    }

    // Execute the raw query
    return await this.prisma.$queryRaw(query, ...(values || []))
  }
}

// Create secure Prisma wrapper
export function createSecurePrisma(prisma: any): SecurePrismaWrapper {
  return new SecurePrismaWrapper(prisma)
}