/**
 * Auth.js Configuration
 * Handles authentication setup with credentials provider, JWT sessions, and role-based access control for NPCL Dashboard.
 */

import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@lib/prisma'
import { verifyPassword } from '@lib/auth'
import { UserRole } from '@prisma/client'
import { serverEnv, isDevelopment, isProduction } from '@config/env.server'
import { checkAuthRateLimit, recordFailedAuth, recordSuccessfulAuth } from '@lib/rate-limiting'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      role: UserRole
    }
  }

  interface User {
    id: string
    name: string
    email: string
    role: UserRole
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: UserRole
  }
}

export const authOptions: NextAuthOptions = {
  // Using JWT strategy for stateless authentication
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { 
          label: 'Email', 
          type: 'email',
          placeholder: 'Enter your email'
        },
        password: { 
          label: 'Password', 
          type: 'password',
          placeholder: 'Enter your password'
        }
      },
      async authorize(credentials, req) {
        if (isDevelopment) {
          console.log('Authorization attempt for:', credentials?.email)
        }
        
        // Return null for missing credentials to prevent authentication
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Check rate limiting before processing authentication (only checks status)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rateLimitResult = await checkAuthRateLimit(credentials.email, req as any)
        if (!rateLimitResult.allowed) {
          if (isDevelopment) {
            console.log('Rate limit exceeded for:', credentials.email, rateLimitResult)
          }
          
          // Log rate limit event for audit purposes
          try {
            await prisma.auditLog.create({
              data: {
                userId: null,
                action: 'login_rate_limited',
                resource: 'auth',
                details: { 
                  email: credentials.email,
                  attempts: rateLimitResult.totalAttempts,
                  resetTime: rateLimitResult.resetTime.toISOString()
                },
              }
            })
          } catch (auditError) {
            console.warn('Failed to log rate limit audit event:', auditError)
          }
          
          // Return null to prevent authentication
          return null
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email.toLowerCase() },
            select: {
              id: true,
              name: true,
              email: true,
              password: true,
              role: true,
              isDeleted: true,
            }
          })

          if (!user || user.isDeleted) {
            // Record failed attempt since authentication failed
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await recordFailedAuth(credentials.email, req as any)
            
            // Log failed login attempt
            try {
              await prisma.auditLog.create({
                data: {
                  userId: null,
                  action: 'login_failed',
                  resource: 'auth',
                  details: { 
                    email: credentials.email,
                    reason: 'user_not_found_or_deleted',
                    method: 'nextauth_credentials'
                  },
                }
              })
            } catch (auditError) {
              console.warn('Failed to log failed login audit event:', auditError)
            }
            
            return null
          }

          const isValidPassword = await verifyPassword(credentials.password, user.password)
          
          if (!isValidPassword) {
            // Record failed attempt since authentication failed
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await recordFailedAuth(credentials.email, req as any)
            
            // Log failed login attempt
            try {
              await prisma.auditLog.create({
                data: {
                  userId: user.id,
                  action: 'login_failed',
                  resource: 'auth',
                  details: { 
                    email: credentials.email,
                    reason: 'invalid_password',
                    method: 'nextauth_credentials'
                  },
                }
              })
            } catch (auditError) {
              console.warn('Failed to log failed login audit event:', auditError)
            }
            
            return null
          }
          
          // Record successful authentication (resets rate limit)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await recordSuccessfulAuth(credentials.email, req as any)
          
          // Log successful login for audit purposes
          try {
            await prisma.auditLog.create({
              data: {
                userId: user.id,
                action: 'login',
                resource: 'auth',
                details: { method: 'nextauth_credentials', email: user.email },
              }
            })
          } catch (auditError) {
            console.warn('Failed to log audit event:', auditError)
          }
          
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          }
        } catch (error) {
          console.error('Authorization error:', error)
          
          // Record failed attempt for system errors
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await recordFailedAuth(credentials.email, req as any)
          
          // Log system error for audit purposes
          try {
            await prisma.auditLog.create({
              data: {
                userId: null,
                action: 'login_error',
                resource: 'auth',
                details: { 
                  email: credentials.email,
                  error: error instanceof Error ? error.message : 'Unknown error',
                  method: 'nextauth_credentials'
                },
              }
            })
          } catch (auditError) {
            console.warn('Failed to log error audit event:', auditError)
          }
          
          return null
        }
      }
    })
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Persist user data to the token right after signin
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      
      // Handle session updates
      if (trigger === 'update' && session?.user) {
        if (session.user.name) {
          token.name = session.user.name
        }
        if (session.user.email) {
          token.email = session.user.email
        }
      }
      
      return token
    },
    async session({ session, token }) {
      // Send properties to the client
      if (token) {
        session.user.id = token.id
        session.user.role = token.role
      }
      return session
    },
    async signIn() {
      // Allow sign in
      return true
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      // Fallback to dashboard for external URLs
      return `${baseUrl}/dashboard`
    }
  },

  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
  },

  events: {
    async signOut({ token }) {
      // Log logout event
      if (token?.id) {
        try {
          await prisma.auditLog.create({
            data: {
              userId: token.id as string,
              action: 'logout',
              resource: 'auth',
              details: { method: 'nextauth_signout' },
            }
          })
        } catch (auditError) {
          console.warn('Failed to log logout audit event:', auditError)
        }
      }
    }
  },

  // Security settings
  secret: serverEnv.NEXTAUTH_SECRET,
  
  // Cookie settings
  cookies: {
    sessionToken: {
      name: `${isProduction ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: isProduction,
        maxAge: 24 * 60 * 60, // 24 hours
      },
    },
  },

  // Enable debug in development
  debug: isDevelopment,
}