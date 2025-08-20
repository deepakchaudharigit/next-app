# Authentication System Migration Guide

## Overview

This document outlines the migration from custom authentication APIs to NextAuth.js-only authentication in the NPCL Dashboard application.

## What Changed

### Removed Components

1. **Custom Authentication APIs**
   - ❌ `POST /api/auth/login` - Custom login endpoint
   - ❌ `POST /api/auth/logout` - Custom logout endpoint
   - ❌ `app/api/auth/login/route.ts` - Deleted
   - ❌ `app/api/auth/logout/route.ts` - Deleted

2. **Deprecated Functions**
   - ❌ `generateToken()` - JWT token generation
   - ❌ `verifyToken()` - JWT token verification
   - ❌ `extractTokenFromHeader()` - Authorization header parsing
   - ❌ `JWTPayload` interface - Legacy JWT interface

### What Remains (NextAuth.js System)

✅ **NextAuth.js Built-in Endpoints**
- `GET/POST /api/auth/[...nextauth]` - NextAuth.js handler
- `GET /api/auth/session` - Session information
- `POST /api/auth/signin/credentials` - Sign in
- `POST /api/auth/signout` - Sign out
- `GET /api/auth/csrf` - CSRF token
- `GET /api/auth/providers` - Available providers

✅ **Custom Utility Endpoints**
- `GET /api/auth/verify` - Verify current session
- `POST /api/auth/test-login` - Test credentials (development)
- `POST /api/auth/register` - User registration
- `POST /api/auth/forgot-password` - Password reset
- `POST /api/auth/reset-password` - Password reset confirmation
- `POST /api/auth/change-password` - Password change

✅ **Frontend Components**
- `useAuth` hook (already using NextAuth.js)
- `LoginForm` component (already using NextAuth.js)
- `SessionProvider` (NextAuth.js provider)
- All authentication pages (`/auth/login`, `/auth/register`, etc.)

## Migration Impact

### For Frontend Development
**No changes required** - The frontend was already using NextAuth.js through the `useAuth` hook.

```typescript
// This continues to work as before
import { useAuth } from '@/hooks/use-auth'

function MyComponent() {
  const { user, login, logout, isAuthenticated } = useAuth()
  // ... component logic
}
```

### For API Development
**Use NextAuth.js session management** instead of custom JWT tokens:

```typescript
// ✅ Correct way (NextAuth.js)
import { getServerSession } from 'next-auth'
import { authOptions } from '@lib/nextauth'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // ... API logic
}

// ❌ Old way (removed)
// import { verifyToken } from '@lib/auth'
// const token = extractTokenFromHeader(req.headers.get('authorization'))
// const payload = verifyToken(token)
```

### For Testing
**Use NextAuth.js endpoints** for authentication testing:

```javascript
// ✅ Test credentials without session
const response = await fetch('/api/auth/test-login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@example.com', password: 'password' })
})

// ✅ Check session status
const sessionResponse = await fetch('/api/auth/session')
const session = await sessionResponse.json()
```

### For External Integrations
**Use NextAuth.js session-based authentication**:

1. **Web Applications**: Use `next-auth/react` client library
2. **API Clients**: Use session cookies (sign in through web interface first)
3. **Testing Tools**: Use `/api/auth/test-login` for credential validation

## Environment Variables

No changes required - the same NextAuth.js environment variables are used:

```bash
# Required
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Optional
JWT_EXPIRES_IN="24h"
SESSION_MAX_AGE="86400"
```

## Database Schema

No changes required - NextAuth.js tables were already present:
- `users` - User accounts
- `accounts` - OAuth accounts (if using OAuth providers)
- `sessions` - User sessions
- `verification_tokens` - Email verification tokens

## Security Improvements

✅ **Enhanced Security Features**:
- HTTP-only session cookies (no client-side token access)
- Built-in CSRF protection
- Secure cookie settings in production
- Automatic session refresh
- No manual JWT token management

## Testing

Run the validation script to ensure everything is working:

```bash
# Validate implementation
node scripts/validate-implementation.js

# Test API endpoints
node scripts/test-json-api.js

# Run test suite
npm test
```

## Troubleshooting

### Common Issues

1. **"Authentication required" errors**
   - Ensure you're signed in through NextAuth.js
   - Check that session cookies are being sent
   - Verify `NEXTAUTH_SECRET` is set

2. **Session not persisting**
   - Check `NEXTAUTH_URL` matches your domain
   - Verify database connection
   - Ensure cookies are enabled

3. **API calls failing**
   - Use session-based authentication instead of Authorization headers
   - Sign in through the web interface first
   - Check `/api/auth/session` for current session status

### Development Tools

```bash
# Check current session
curl http://localhost:3000/api/auth/session

# Test credentials
curl -X POST http://localhost:3000/api/auth/test-login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@npcl.com","password":"admin123"}'

# Get API documentation
curl http://localhost:3000/api/docs
```

## Benefits of Migration

1. **Simplified Architecture**: Single authentication system
2. **Better Security**: Built-in CSRF protection and secure cookies
3. **Easier Maintenance**: No custom JWT token management
4. **Industry Standard**: NextAuth.js is widely adopted and maintained
5. **Better Testing**: Consistent authentication flow for all environments

## Support

- **API Documentation**: Visit `/api/docs` for complete API reference
- **NextAuth.js Docs**: https://next-auth.js.org/
- **Test Accounts**: See `.env.example` for development credentials