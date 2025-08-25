# Repository Tour

## 🎯 What This Repository Does

NPCL Dashboard is a comprehensive power management system for Noida Power Company Limited (NPCL) that provides real-time monitoring, user management, and operational control of power generation facilities.

**Key responsibilities:**
- Real-time power generation monitoring and analytics
- Role-based user authentication and authorization (Admin, Operator, Viewer)
- Voicebot call tracking and reporting system
- Audit logging and system activity monitoring

---

## 🏗️ Architecture Overview

### System Context
```
[Power Units] → [NPCL Dashboard] → [PostgreSQL Database]
     ↓               ↓                    ↓
[Operators] → [Authentication] → [Audit Logs]
     ↓               ↓                    ↓
[Reports] ← [Dashboard APIs] ← [Session Management]
```

### Key Components
- **Authentication System** - NextAuth.js with JWT sessions and role-based access control
- **Dashboard API** - RESTful endpoints for power monitoring, user management, and reporting
- **Database Layer** - Prisma ORM with PostgreSQL for data persistence and relationships
- **Middleware Protection** - Route-level security with role-based access enforcement
- **Monitoring System** - Health checks, audit logging, and system performance tracking

### Data Flow
1. User authenticates via NextAuth.js credentials provider with bcrypt password verification
2. Middleware validates JWT tokens and enforces role-based route access
3. API routes process requests with Prisma ORM for database operations
4. Dashboard components fetch real-time data and display power generation metrics
5. All user actions are logged to audit trail for compliance and security

---

## 📁 Project Structure [Partial Directory Tree]

```
npcl-dashboard/
├── app/                    # Next.js App Router
│   ├── api/               # Backend API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── dashboard/     # Dashboard data APIs
│   │   ├── health/        # System health monitoring
│   │   └── reports/       # Report generation APIs
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main dashboard interface
│   └── reports/           # Report viewing pages
├── components/            # React components
│   ├── auth/              # Authentication components
│   ├── dashboard/         # Dashboard UI components
│   └── providers/         # Context providers
├── lib/                   # Utility libraries
│   ├── auth.ts            # Password hashing and verification
│   ├── prisma.ts          # Database client configuration
│   ├── nextauth.ts        # NextAuth.js configuration
│   └── validations.ts     # Zod input validation schemas
├── middleware/            # Custom middleware
├── prisma/                # Database schema and migrations
│   ├── schema.prisma      # Database schema definition
│   └── seed.ts            # Database seeding script
├── config/                # Configuration files
├── types/                 # TypeScript type definitions
└── __tests__/             # Test suites
```

### Key Files to Know

| File | Purpose | When You'd Touch It |
|------|---------|---------------------|
| `app/layout.tsx` | Root layout with session provider | Adding global UI elements |
| `lib/nextauth.ts` | Authentication configuration | Modifying auth behavior |
| `prisma/schema.prisma` | Database schema | Adding new data models |
| `middleware.ts` | Route protection and RBAC | Changing access control |
| `app/api/dashboard/stats/route.ts` | Dashboard statistics API | Adding new metrics |

---

## 🔧 Technology Stack

### Core Technologies
- **Language:** TypeScript (5.3.3) - Type safety and enhanced developer experience
- **Framework:** Next.js (15.4.0) - Full-stack React framework with App Router
- **Database:** PostgreSQL - Relational database for complex data relationships
- **ORM:** Prisma (6.14.0) - Type-safe database client with migrations

### Key Libraries
- **NextAuth.js (4.24.5)** - Authentication with JWT sessions and role-based access
- **Tailwind CSS (3.3.6)** - Utility-first CSS framework for responsive design
- **Zod (3.22.4)** - Runtime type validation and input sanitization
- **bcryptjs (2.4.3)** - Password hashing and verification
- **Recharts (2.8.0)** - Data visualization for power generation charts

### Development Tools
- **Jest (29.7.0)** - Testing framework with coverage reporting
- **React Testing Library (16.3.0)** - Component testing utilities
- **ESLint (9.15.0)** - Code linting and style enforcement
- **TypeScript ESLint (8.39.0)** - TypeScript-specific linting rules

---

## 🌐 External Dependencies

### Required Services
- **PostgreSQL Database** - Primary data storage for users, power readings, and audit logs
- **SMTP Server** - Email notifications for password resets and system alerts
- **Redis (Optional)** - Session storage and caching for improved performance

### Optional Integrations
- **Email Service** - Password reset and notification delivery
- **Monitoring Service** - Health check endpoints for external monitoring systems

### Environment Variables

```bash
# Required
DATABASE_URL=          # PostgreSQL connection string
NEXTAUTH_SECRET=       # JWT signing secret
NEXTAUTH_URL=          # Application base URL

# Optional
EMAIL_HOST=            # SMTP server for notifications
EMAIL_PORT=            # SMTP port (default: 587)
EMAIL_USER=            # SMTP username
EMAIL_PASS=            # SMTP password
```

---

## 🔄 Common Workflows

### User Authentication Flow
1. User submits credentials via login form with Zod validation
2. NextAuth.js credentials provider verifies password with bcrypt
3. JWT token generated with user ID, role, and session data
4. Middleware validates token on subsequent requests and enforces RBAC
5. Audit log entry created for login/logout events

**Code path:** `app/auth/login` → `lib/nextauth.ts` → `middleware.ts` → `app/dashboard`

### Dashboard Data Retrieval
1. Dashboard component requests real-time statistics from API
2. API route validates user session and role permissions
3. Prisma queries aggregate data from multiple database tables
4. Response includes power generation metrics and recent activity
5. Client updates UI with real-time data visualization

**Code path:** `app/dashboard/page.tsx` → `app/api/dashboard/stats/route.ts` → `lib/prisma.ts`

### Role-Based Access Control
1. Middleware intercepts all protected route requests
2. JWT token decoded to extract user role information
3. Route permissions checked against user role hierarchy
4. Access granted/denied based on role-specific route mappings
5. Unauthorized access redirected with error message

**Code path:** `middleware.ts` → `components/auth/RoleGuard.tsx` → Protected Components

---

## 📈 Performance & Scale

### Performance Considerations
- **Database Indexing:** Optimized queries on user email, timestamps, and foreign keys
- **JWT Sessions:** Stateless authentication reduces database load
- **Connection Pooling:** Prisma manages PostgreSQL connections efficiently

### Monitoring
- **Health Checks:** `/api/health` endpoint monitors database connectivity and memory usage
- **Audit Logging:** Comprehensive activity tracking for security and compliance
- **Error Tracking:** Structured logging with environment-specific verbosity

---

## 🚨 Things to Be Careful About

### 🔒 Security Considerations
- **Authentication:** JWT tokens with secure cookie settings and CSRF protection
- **Password Security:** bcrypt hashing with configurable salt rounds
- **Role-Based Access:** Middleware enforcement prevents unauthorized route access
- **Input Validation:** Zod schemas validate all API inputs and prevent injection attacks

### Data Handling
- **Sensitive Data:** User passwords are hashed, audit logs track all system access
- **Database Transactions:** Prisma ensures data consistency for critical operations
- **Session Management:** Secure cookie configuration with environment-specific settings

### External APIs
- **Rate Limiting:** Configurable limits on authentication attempts
- **Error Handling:** Graceful degradation when external services are unavailable
- **Health Monitoring:** Automated checks for database and service availability

---

*Updated at: 2025-01-27 UTC*
*Last commit: 8c0297f - dockerised which is running successfully*