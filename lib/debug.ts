/**
 * Debug Utilities
 * Helper functions for debugging in development
 */

const isDevelopment = process.env.NODE_ENV === 'development'

/**
 * Enhanced console.log with context and formatting
 */
export const debugLog = (context: string, message: string, data?: any) => {
  if (!isDevelopment) return
  
  const timestamp = new Date().toISOString().split('T')[1]?.split('.')[0] || '00:00:00'
  const prefix = `🔍 [${timestamp}] [${context}]`
  
  if (data) {
    console.group(`${prefix} ${message}`)
    console.log(typeof data === 'object' ? JSON.stringify(data, null, 2) : data)
    console.groupEnd()
  } else {
    console.log(`${prefix} ${message}`)
  }
}

/**
 * Performance timing utility
 */
export class DebugTimer {
  private startTime: number
  private context: string

  constructor(context: string) {
    this.context = context
    this.startTime = performance.now()
    debugLog(this.context, 'Timer started')
  }

  end(message?: string) {
    const endTime = performance.now()
    const duration = endTime - this.startTime
    debugLog(
      this.context, 
      `Timer ended${message ? `: ${message}` : ''} (${duration.toFixed(2)}ms)`
    )
    return duration
  }
}

/**
 * API request/response debugger
 */
export const debugAPI = {
  request: (url: string, options?: RequestInit) => {
    debugLog('API', `→ ${options?.method || 'GET'} ${url}`, {
      headers: options?.headers,
      body: options?.body
    })
  },
  
  response: (url: string, response: Response, data?: any) => {
    debugLog('API', `← ${response.status} ${url}`, {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data: data
    })
  },
  
  error: (url: string, error: Error) => {
    debugLog('API', `✗ Error ${url}`, {
      message: error.message,
      stack: error.stack
    })
  }
}

/**
 * Component lifecycle debugger
 */
export const debugComponent = (componentName: string) => ({
  mount: (props?: any) => {
    debugLog('COMPONENT', `${componentName} mounted`, props)
  },
  
  update: (prevProps?: any, nextProps?: any) => {
    debugLog('COMPONENT', `${componentName} updated`, {
      prevProps,
      nextProps
    })
  },
  
  unmount: () => {
    debugLog('COMPONENT', `${componentName} unmounted`)
  },
  
  render: (props?: any, state?: any) => {
    debugLog('COMPONENT', `${componentName} rendered`, { props, state })
  }
})

/**
 * Database query debugger
 */
export const debugDB = {
  query: (operation: string, model: string, data?: any) => {
    debugLog('DATABASE', `${operation} ${model}`, data)
  },
  
  result: (operation: string, model: string, result: any, duration?: number) => {
    debugLog('DATABASE', `${operation} ${model} completed${duration ? ` (${duration}ms)` : ''}`, {
      resultCount: Array.isArray(result) ? result.length : result ? 1 : 0,
      result: Array.isArray(result) ? `${result.length} items` : result
    })
  },
  
  error: (operation: string, model: string, error: Error) => {
    debugLog('DATABASE', `${operation} ${model} failed`, {
      message: error.message,
      stack: error.stack
    })
  }
}

/**
 * Authentication flow debugger
 */
export const debugAuth = {
  attempt: (email: string, method: string) => {
    debugLog('AUTH', `Login attempt: ${email} via ${method}`)
  },
  
  success: (userId: string, role: string) => {
    debugLog('AUTH', `Login successful`, { userId, role })
  },
  
  failure: (email: string, reason: string) => {
    debugLog('AUTH', `Login failed: ${email}`, { reason })
  },
  
  logout: (userId: string) => {
    debugLog('AUTH', `Logout: ${userId}`)
  },
  
  session: (action: string, data?: any) => {
    debugLog('AUTH', `Session ${action}`, data)
  }
}

/**
 * Conditional debugger - only runs if condition is true
 */
export const debugIf = (condition: boolean, context: string, message: string, data?: any) => {
  if (condition) {
    debugLog(context, message, data)
  }
}

/**
 * Debug hook for React components
 */
export const useDebug = (componentName: string) => {
  if (!isDevelopment) {
    return {
      log: () => {},
      timer: () => ({ end: () => {} }),
      component: {
        mount: () => {},
        update: () => {},
        unmount: () => {},
        render: () => {}
      }
    }
  }

  return {
    log: (message: string, data?: any) => debugLog(componentName, message, data),
    timer: (label: string) => new DebugTimer(`${componentName}:${label}`),
    component: debugComponent(componentName)
  }
}

/**
 * Environment info for debugging
 */
export const getDebugInfo = () => {
  if (!isDevelopment) return null
  
  return {
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
      nextAuthUrl: process.env.NEXTAUTH_URL,
      databaseUrl: process.env.DATABASE_URL ? '***configured***' : 'not set'
    },
    runtime: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    },
    timestamp: new Date().toISOString()
  }
}

// Export a default debug instance
export const debug = {
  log: debugLog,
  timer: (context: string) => new DebugTimer(context),
  api: debugAPI,
  component: debugComponent,
  db: debugDB,
  auth: debugAuth,
  if: debugIf,
  info: getDebugInfo
}