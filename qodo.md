# Repository Tour

## 🎯 What This Repository Does

NPCL Dashboard is a comprehensive management dashboard for NPCL (Noida Power Company Limited) built with Next.js 15, TypeScript, Prisma, and PostgreSQL.

**Key responsibilities:**
- Role-based user authentication and authorization (Admin, Operator, Viewer)
- Voicebot call tracking and management system
- Dashboard analytics with comprehensive statistics and data visualization
- Audit logging and automated report generation
- User management and system administration

---

## 🏗️ Architecture Overview

### System Context
```
[Voicebot Calls] → [NPCL Dashboard] → [PostgreSQL Database]
                        ↓
[Users (Admin/Operator/Viewer)] ← [NextAuth.js Authentication] → [Session Management]
                        ↓
                   [Reports & Analytics]
```

### Key Components
- **Authentication System** - NextAuth.js with role-based access control (RBAC) for secure user management
- **Voicebot Call Management** - Tracking and analysis of voicebot interactions with comprehensive filtering
- **Dashboard Analytics** - System statistics, user metrics, and performance monitoring
- **Report Generation** - Automated report generation with CSV/Excel export capabilities
- **Audit System** - Complete audit trail for all system activities and user actions
- **User Management** - Admin interface for managing users and their roles

### Data Flow
1. **User Authentication** - Users authenticate via NextAuth.js with role-based permissions
2. **Voicebot Data Collection** - Call data is collected and stored in PostgreSQL via API endpoints
3. **Dashboard Processing** - Data is processed and displayed through responsive React components
4. **Report Generation** - Reports are generated with filtering options and exported in various formats
5. **Audit Logging** - All user actions and system events are logged for compliance

---

## 📁 Project Structure [Partial Directory Tree]

```
NPCL/
├── app/                    # Next.js 15 App Router
│   ├── api/               # API routes for backend functionality
│   │   ├── auth/          # Authentication endpoints (NextAuth + custom)
│   │   │   ├── [...nextauth]/  # NextAuth.js dynamic route
│   │   │   ├── login/     # Custom login endpoint
│   │   │   ├── register/  # User registration
│   │   │   ├── users/     # User management (Admin only)
│   │   │   └── profile/   # User profile management
│   │   ├── dashboard/     # Dashboard data endpoints
│   │   │   └── stats/     # System statistics API
│   │   ├── reports/       # Report generation and export
│   │   │   └── voicebot-calls/  # Voicebot call reports
│   │   └── health/        # Health check endpoint
│   ├── auth/              # Authentication pages (login, register, etc.)
│   ├── dashboard/         # Dashboard pages and layouts
│   ├── reports/           # Report viewing pages
│   ├── layout.tsx         # Root layout with session provider
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── auth/              # Authentication components
│   │   ├── LoginForm.tsx  # Login form component
│   │   ├── RoleGuard.tsx  # Role-based access control component
│   │   └── UserProfile.tsx # User profile display
│   ├── dashboard/         # Dashboard-specific components
│   │   ├── DashboardStats.tsx # Statistics cards
│   │   └── PowerGenerationChart.tsx # Data visualization
│   └── providers/         # Context providers (session, etc.)
├── lib/                   # Utility libraries and configurations
│   ├── auth.ts            # Password hashing and authentication utilities
│   ├── nextauth.ts        # NextAuth.js configuration
│   ├── prisma.ts          # Prisma client configuration
│   ├── rbac.ts            # Role-based access control
│   └── validations.ts     # Zod schemas for data validation
├── config/                # Configuration files
│   ├── env.server.ts      # Server-side environment variables
│   ├── env.client.ts      # Client-side environment variables
│   └── auth.ts            # Authentication configuration
├── prisma/                # Database schema and migrations
│   ├── schema.prisma      # Database schema definition
│   └── seed.ts            # Database seeding script
├── middleware.ts          # Next.js middleware for route protection
├── __tests__/             # Test suite (10+ test files)
└── docker-compose.yml     # Multi-service Docker setup
```

### Key Files to Know

| File | Purpose | When You'd Touch It |
|------|---------|---------------------|
| `app/layout.tsx` | Root layout with session provider | Adding global providers or styling |
| `lib/nextauth.ts` | NextAuth.js configuration | Modifying authentication flow |
| `prisma/schema.prisma` | Database schema | Adding new models or fields |
| `middleware.ts` | Route protection middleware | Changing access control rules |
| `config/env.server.ts` | Server environment configuration | Adding new environment variables |
| `lib/rbac.ts` | Role-based access control | Modifying user permissions |
| `docker-compose.yml` | Multi-service setup | Changing development environment |
| `package.json` | Dependencies and scripts | Adding new packages or scripts |

---

## 🔧 Technology Stack

### Core Technologies
- **Language:** TypeScript (5.3.3) - Type safety and better developer experience
- **Framework:** Next.js 15 (App Router) - Full-stack React framework with server-side rendering
- **Database:** PostgreSQL - Robust relational database for user and call data
- **ORM:** Prisma (5.7.1) - Type-safe database access and migrations

### Key Libraries
- **NextAuth.js (4.24.5)** - Authentication and session management with role-based access
- **React 19** - Modern React with concurrent features for responsive UI
- **Tailwind CSS** - Utility-first CSS framework for responsive design
- **Zod** - TypeScript-first schema validation for API endpoints
- **@json2csv/plainjs** - CSV export functionality for reports
- **bcryptjs** - Password hashing for secure authentication
- **ExcelJS** - Excel file generation for advanced reporting

### Development Tools
- **Jest & React Testing Library** - Testing framework with comprehensive test coverage
- **ESLint & TypeScript** - Code quality and type checking
- **Prisma Studio** - Database management and visualization
- **Docker & Docker Compose** - Containerized development environment

---

## 🌐 External Dependencies

### Required Services
- **PostgreSQL Database** - Primary data storage for users, voicebot calls, reports, and audit logs
- **Redis (Docker)** - Session storage and caching for improved performance

### Optional Integrations
- **SMTP Server** - Email notifications for password resets and system alerts
- **Nginx (Production)** - Reverse proxy and SSL termination in production deployment

---

### Environment Variables

```bash
# Required
DATABASE_URL=              # PostgreSQL connection string
NEXTAUTH_SECRET=           # JWT secret for NextAuth.js
NEXTAUTH_URL=              # Application URL for NextAuth.js

# Optional
EMAIL_HOST=                # SMTP host for notifications
EMAIL_PORT=                # SMTP port (default: 587)
JWT_EXPIRES_IN=            # JWT expiration time (default: 24h)
BCRYPT_SALT_ROUNDS=        # Password hashing rounds (default: 12)
```

---

## 🔄 Common Workflows

### User Authentication Flow
1. User accesses protected route
2. Middleware checks NextAuth.js session
3. If unauthenticated, redirects to login page
4. Credentials are validated against PostgreSQL via Prisma
5. Session is created and user is granted role-based access

**Code path:** `middleware.ts` → `lib/nextauth.ts` → `lib/auth.ts` → `prisma/schema.prisma`

### Voicebot Call Management
1. Voicebot call data is received via API endpoints
2. Data is validated using Zod schemas and stored in PostgreSQL
3. Dashboard displays call statistics and trends
4. Users can filter and export call data as reports

**Code path:** `app/api/reports/voicebot-calls` → `lib/prisma.ts` → `components/dashboard/DashboardStats.tsx`

### Report Generation
1. User requests report from dashboard with filters
2. API endpoint queries VoicebotCall table for specified criteria
3. Data is processed and formatted (CSV/Excel)
4. Report is generated and made available for download

**Code path:** `app/reports/[id]` → `app/api/reports/voicebot-calls/exports` → `@json2csv/plainjs`

---

## 📈 Performance & Scale

### Performance Considerations
- **Database Optimization:** Prisma ORM with connection pooling and query optimization
- **Caching:** Redis integration for session storage and frequently accessed data
- **Client-side:** React 19 concurrent features for responsive UI updates

### Monitoring
- **Health Checks:** `/api/health` endpoint for comprehensive service monitoring
- **Audit Logging:** Complete audit trail stored in PostgreSQL
- **System Metrics:** Memory usage, database connectivity, and uptime monitoring

---

## 🚨 Things to Be Careful About

### 🔒 Security Considerations
- **Authentication:** NextAuth.js with secure session management and CSRF protection
- **Authorization:** Role-based access control (RBAC) with Admin, Operator, and Viewer roles
- **Data Protection:** Password hashing with bcrypt, secure environment variable handling
- **API Security:** Input validation with Zod schemas, middleware-based route protection

### 🔧 Development Notes
- **Database Migrations:** Always run `npm run db:generate` after schema changes
- **Environment Setup:** Copy `.env.example` to `.env` and configure all required variables
- **Testing:** Comprehensive test suite covering API endpoints, authentication, and utilities
- **Docker Development:** Use `docker-compose.yml` for consistent development environment
- **Role Management:** Be careful when modifying RBAC permissions in `lib/rbac.ts`

---

*Update to last commit: 8bee6f04e3e93729c05e48b837e5847bb143fcf3*
*Updated at: 2025-01-27 UTC*