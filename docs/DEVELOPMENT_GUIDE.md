# NPCL Dashboard - Development Guide

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- Docker (optional)

### Installation
```bash
git clone <repository-url>
cd npcl-dashboard
npm install
cp .env.example .env
# Edit .env with your configuration
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

### Default Test Accounts
| Role     | Email             | Password    |
|----------|-------------------|-------------|
| Admin    | admin@npcl.com    | admin123    |
| Operator | operator@npcl.com | operator123 |
| Viewer   | viewer@npcl.com   | viewer123   |

## Project Structure

```
npcl-dashboard/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── auth/              # Authentication components
│   ├── dashboard/         # Dashboard components
│   └── ui/                # Reusable UI components
├── lib/                   # Utility libraries
│   ├── auth.ts            # Authentication utilities
│   ├── prisma.ts          # Prisma client
│   ├── utils.ts           # General utilities
│   └── validations.ts     # Zod schemas
├── prisma/                # Database schema and migrations
├── __tests__/             # Test files
└── docs/                  # Documentation
```

## Technology Stack

- **Language:** TypeScript (5.3.3)
- **Framework:** Next.js 15 (App Router)
- **Database:** PostgreSQL with Prisma ORM (5.7.1)
- **Authentication:** NextAuth.js (4.24.5)
- **Styling:** Tailwind CSS
- **Testing:** Jest + React Testing Library

## Development Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run db:generate      # Generate Prisma client
npm run db:migrate       # Run database migrations
npm run db:push          # Push schema changes
npm run db:seed          # Seed database with test data
npm run db:studio        # Open Prisma Studio

# Testing
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage
npm run test:security    # Run security-focused tests

# Docker
npm run docker:dev       # Start with Docker
npm run docker:prod      # Production Docker setup
```

## Environment Configuration

### Required Variables
```env
DATABASE_URL="postgresql://username:password@localhost:5432/npcl_dashboard"
NEXTAUTH_SECRET="your-secret-key-here-make-it-long-and-random"
NEXTAUTH_URL="http://localhost:3000"
```

### Optional Variables
```env
# Email Configuration
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"

# Security Settings
BCRYPT_SALT_ROUNDS="12"
JWT_EXPIRES_IN="24h"

# Feature Flags
NEXT_PUBLIC_ENABLE_REGISTRATION="true"
NEXT_PUBLIC_ENABLE_EMAIL_NOTIFICATIONS="true"
```

## API Development

### Authentication Patterns
```typescript
// Require any authenticated user
export const GET = withAuth(async (req, { user }) => {
  // Handler code
})

// Require admin role
export const POST = withAdminAuth(async (req, { user }) => {
  // Handler code
})
```

### Standard Request Validation
```typescript
const body: unknown = await req.json()
const validationResult = schema.safeParse(body)
if (!validationResult.success) {
  return NextResponse.json(
    {
      success: false,
      message: 'Invalid input data',
      errors: validationResult.error.issues,
    },
    { status: 400 }
  )
}
```

### Error Handling Pattern
```typescript
} catch (error: unknown) {
  console.error('Operation error:', error instanceof Error ? error.message : 'Unknown error')
  return NextResponse.json(
    { success: false, message: 'Internal server error' },
    { status: 500 }
  )
}
```

## Testing Guidelines

### Test Structure
```
__tests__/
├── utils/                    # Test utilities and mock factories
├── lib/                      # Library function tests
├── api/                      # API endpoint tests
├── components/               # React component tests
├── hooks/                    # Custom hook tests
└── integration/              # End-to-end tests
```

### Security Testing
- Password hashing with bcrypt (12 salt rounds)
- Role-based access control (RBAC)
- Input validation and sanitization
- Authentication middleware testing

### Running Tests
```bash
npm test                     # All tests
npm run test:unit           # Unit tests only
npm run test:api            # API tests only
npm run test:security       # Security tests only
```

## Code Quality Standards

### TypeScript Safety
- No `any` types allowed
- Strict type checking enabled
- Proper error handling with type guards
- Zod validation for all API inputs

### ESLint Rules
- `@typescript-eslint/no-explicit-any: error`
- `@typescript-eslint/no-unsafe-argument: warn`
- Consistent import paths using `@/lib/*`

### Security Practices
- Input validation with Zod schemas
- Password hashing with bcrypt
- Secure session management
- Audit logging for all actions

## Performance Optimization

### Database
- Connection pooling with Prisma
- Proper indexing on frequently queried fields
- Query optimization with select statements

### Application
- Next.js App Router for optimal performance
- Image optimization with Next.js Image component
- Proper caching strategies

## Troubleshooting

### Common Issues
1. **Database connection failed**
   - Check PostgreSQL is running
   - Verify DATABASE_URL format
   - Ensure database exists

2. **Authentication issues**
   - Check NEXTAUTH_SECRET is set
   - Verify NEXTAUTH_URL matches your domain
   - Clear browser cache and cookies

3. **Build failures**
   - Run `npm run db:generate` after schema changes
   - Check for TypeScript errors
   - Verify all imports are correct

### Debug Commands
```bash
# Check database connection
npx prisma db pull

# Validate environment
node -e "console.log(process.env.DATABASE_URL)"

# Check application health
curl http://localhost:3000/api/health
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Follow the coding standards
4. Write tests for new functionality
5. Ensure all tests pass
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## Best Practices

### Code Organization
- Keep components small and focused
- Use custom hooks for reusable logic
- Separate business logic from UI components
- Follow the established file structure

### Database Design
- Use meaningful table and column names
- Implement proper relationships with foreign keys
- Add appropriate indexes for performance
- Use Prisma migrations for schema changes

### Security
- Validate all user inputs
- Use parameterized queries (Prisma handles this)
- Implement proper authentication and authorization
- Log security-relevant events

### Testing
- Write tests for all new features
- Test both happy path and error cases
- Mock external dependencies
- Maintain good test coverage (80%+)