# NPCL Dashboard - Backend Summary

## Overview

The NPCL Dashboard backend is a robust, API-focused system built with Next.js 15, TypeScript, and PostgreSQL. After refactoring, it retains only the essential backend functionality: **NextAuth.js authentication** and **reports management APIs**, providing a clean, deployment-ready backend service.

## Architecture Overview

### Core Technologies
- **Framework**: Next.js 15 (App Router) - API routes only
- **Language**: TypeScript 5.3.3
- **Database**: PostgreSQL with Prisma ORM 5.7.1
- **Authentication**: NextAuth.js 4.24.5 with JWT strategy
- **Validation**: Zod schemas for input validation
- **Security**: bcryptjs for password hashing, RBAC system

### System Architecture
```
[Client Applications] 
        ↓
[Next.js API Routes]
        ↓
[NextAuth.js Middleware] → [RBAC Authorization]
        ↓
[Prisma ORM] → [PostgreSQL Database]
```

## Authentication System (NextAuth.js)

### Core Features
- **JWT-based sessions** for stateless authentication
- **Role-based access control** (Admin, Operator, Viewer)
- **Secure password hashing** with bcrypt (12 salt rounds)
- **Audit logging** for all authentication events
- **Password reset functionality** with secure tokens

### Authentication Endpoints

#### NextAuth.js Core Endpoints
- `GET/POST /api/auth/[...nextauth]` - NextAuth.js dynamic route handler
- `GET /api/auth/session` - Current session information
- `GET /api/auth/csrf` - CSRF token for security
- `POST /api/auth/signin/credentials` - Credential-based login
- `POST /api/auth/signout` - User logout

#### Custom Authentication Endpoints
- `POST /api/auth/login` - Direct API login for testing/integration
- `POST /api/auth/register` - User registration with validation
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset confirmation
- `POST /api/auth/change-password` - Authenticated password change
- `GET/PUT /api/auth/profile` - User profile management

#### User Management (Admin Only)
- `GET /api/auth/users` - List all users
- `POST /api/auth/users` - Create new user
- `GET /api/auth/users/[id]` - Get specific user
- `PUT /api/auth/users/[id]` - Update user
- `DELETE /api/auth/users/[id]` - Delete user

### Authentication Configuration

#### NextAuth.js Setup (`lib/nextauth.ts`)
```typescript
export const authOptions: NextAuthOptions = {
  providers: [CredentialsProvider({
    // Custom credential validation against PostgreSQL
    async authorize(credentials) {
      // Email/password validation with bcrypt
      // User lookup in database
      // Audit logging
    }
  })],
  session: { strategy: 'jwt' },
  callbacks: {
    jwt: // Add user info to JWT token
    session: // Expose user data to client
    redirect: // Handle post-login redirects
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error'
  }
}
```

#### Security Features
- **Secure cookies** in production with HttpOnly flag
- **CSRF protection** built into NextAuth.js
- **JWT token validation** on every request
- **Rate limiting** for login attempts
- **IP address logging** for audit trails

## Reports API System

### Core Functionality
The reports system manages voicebot call data with comprehensive filtering, export capabilities, and role-based access control.

### Reports Endpoints

#### Main Reports API
- `GET /api/reports/voicebot-calls` - List voicebot calls with filtering
  - Supports pagination, date ranges, language filtering
  - Query parameters: page, limit, language, cli, callResolutionStatus
  - Duration filtering (min/max seconds)
  - Date range filtering (dateFrom, dateTo)

#### Export Functionality
- `GET /api/reports/voicebot-calls/exports` - Export data in multiple formats
  - Supports CSV and Excel (XLSX) formats
  - Same filtering options as main API
  - Automatic file download with proper headers

#### Filter Options
- `GET /api/reports/voicebot-calls/filters` - Get available filter values
  - Returns distinct languages and call resolution statuses
  - Used for dynamic filter UI generation

#### Individual Records
- `GET /api/reports/voicebot-calls/[id]` - Get specific voicebot call record
  - Returns complete record details
  - Proper error handling for missing records

### Data Models

#### VoicebotCall Model
```typescript
model VoicebotCall {
  id                   String   @id @default(cuid())
  cli                  String
  receivedAt           DateTime
  language             String
  queryType            String
  ticketsIdentified    Int
  transferredToIvr     DateTime?
  durationSeconds      Int
  callResolutionStatus String?
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
}
```

#### Report Model
```typescript
model Report {
  id        String   @id @default(cuid())
  title     String
  content   String?
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## Database Schema

### Core Models Retained

#### User Model (Authentication)
```typescript
model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  password  String
  role      UserRole @default(VIEWER)
  isDeleted Boolean @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  accounts        Account[]
  sessions        Session[]
  userSessions    UserSession[]
  auditLogs       AuditLog[]
  passwordResets  PasswordReset[]
  reports         Report[]
}
```

#### NextAuth.js Required Models
- `Account` - OAuth account linking
- `Session` - Session management
- `VerificationToken` - Email verification

#### Security Models
- `UserSession` - Custom session tracking
- `PasswordReset` - Password reset tokens
- `AuditLog` - Security audit trail

#### Business Models
- `VoicebotCall` - Call data for reports
- `Report` - Generated reports
- `SystemConfig` - Application configuration

### User Roles
```typescript
enum UserRole {
  ADMIN    // Full system access
  OPERATOR // Reports and data management
  VIEWER   // Read-only access
}
```

## Role-Based Access Control (RBAC)

### Permission System (`lib/rbac.ts`)
```typescript
export const permissions: Record<string, UserRole[]> = {
  'users.view': [UserRole.ADMIN],
  'users.create': [UserRole.ADMIN],
  'reports.view': [UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER],
  'reports.create': [UserRole.ADMIN, UserRole.OPERATOR],
  'system.config': [UserRole.ADMIN],
}
```

### Authorization Functions
- `hasPermission(role, permission)` - Check specific permission
- `requireAuth()` - Ensure user is authenticated
- `requirePermission(permission)` - Ensure user has specific permission
- `requireAdmin()` - Admin-only access
- `requireOperatorOrAdmin()` - Operator or Admin access

### Middleware Protection (`middleware.ts`)
- **Route-based protection** using NextAuth.js middleware
- **Role-based access control** for different route patterns
- **API header injection** for user context
- **Automatic redirects** for unauthorized access

## Core Libraries and Utilities

### Authentication Utilities (`lib/auth.ts`)
```typescript
// Password management
export const hashPassword = async (password: string): Promise<string>
export const verifyPassword = async (password: string, hash: string): Promise<boolean>

// Password reset tokens
export const generateResetToken = (): string
export const hashResetToken = (token: string): string

// Deprecated JWT functions (replaced by NextAuth.js)
export const generateToken = () => { throw new Error('Use NextAuth.js') }
```

### Validation Schemas (`lib/validations.ts`)
```typescript
// Authentication schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
})

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.nativeEnum(UserRole).optional()
})

// Reports API schemas
export const voicebotCallsQuerySchema = z.object({
  page: z.string().optional().transform(val => parseInt(val) || 1),
  limit: z.string().optional().transform(val => parseInt(val) || 10),
  language: z.string().optional(),
  // ... other filters
})
```

### Database Client (`lib/prisma.ts`)
- **Singleton Prisma client** with connection pooling
- **Development hot-reload protection**
- **Error handling and logging**

### Environment Configuration
- `config/env.server.ts` - Server-side environment variables
- `config/auth.ts` - Authentication configuration
- Proper separation of client/server environment variables

## API Security and Integration

### Request Flow
1. **Client Request** → API endpoint
2. **Middleware** → NextAuth.js session validation
3. **RBAC Check** → Permission validation
4. **Input Validation** → Zod schema validation
5. **Database Operation** → Prisma ORM
6. **Audit Logging** → Security trail
7. **Response** → JSON with proper error handling

### Security Features
- **JWT token validation** on all protected routes
- **Input sanitization** with Zod schemas
- **SQL injection prevention** via Prisma ORM
- **Rate limiting** for authentication endpoints
- **Audit logging** for all user actions
- **Error handling** without information leakage

### Integration Points

#### NextAuth.js ↔ Reports API
- **Shared user context** via middleware headers
- **Role-based filtering** in reports queries
- **User association** for report creation
- **Audit trail** linking users to actions

#### Database Integration
- **Prisma migrations** for schema management
- **Connection pooling** for performance
- **Transaction support** for data consistency
- **Backup and recovery** procedures

## Error Handling and Logging

### Standardized Error Responses
```typescript
{
  "success": false,
  "message": "Error description",
  "errors": [/* Validation errors */],
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Audit Logging
```typescript
await prisma.auditLog.create({
  data: {
    userId: user.id,
    action: 'login',
    resource: 'auth',
    details: { method: 'credentials' },
    ipAddress: getClientIP(req),
    userAgent: req.headers.get('user-agent')
  }
})
```

## Performance Considerations

### Database Optimization
- **Indexed fields** for common queries (email, role, receivedAt)
- **Connection pooling** via Prisma
- **Query optimization** with select statements
- **Pagination** for large datasets

### Caching Strategy
- **JWT tokens** for stateless sessions
- **Database query optimization**
- **Static asset caching** (minimal in backend-only setup)

### Monitoring
- **Health check endpoint** (if retained)
- **Database connectivity monitoring**
- **Error rate tracking**
- **Performance metrics**

## Development and Testing

### Environment Setup
- **Docker support** for consistent development
- **Environment variable validation**
- **Database seeding** for test data
- **Hot reload** for development

### Testing Strategy (Retained)
- **Authentication API tests** - Login, registration, password reset
- **Reports API tests** - CRUD operations, filtering, exports
- **RBAC tests** - Permission validation
- **Integration tests** - End-to-end API workflows

## Deployment Readiness

### Production Configuration
- **Environment variable validation**
- **Secure cookie configuration**
- **Database migration strategy**
- **Health monitoring**
- **Error logging and alerting**

### Scalability
- **Stateless JWT sessions**
- **Database connection pooling**
- **Horizontal scaling support**
- **Load balancer compatibility**

This backend system provides a solid foundation for authentication and reports management, with clean separation of concerns, comprehensive security, and deployment-ready architecture.