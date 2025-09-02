# NextAuth.js Authentication System

This application now uses NextAuth.js built-in features for session management, login, and logout functionality. This provides a more secure, standardized, and maintainable authentication system.

## 🔧 Architecture Overview

### Frontend Components
- **SessionProvider**: Wraps the app with NextAuth session context
- **useAuth Hook**: Custom hook providing authentication state and actions
- **LogoutButton**: Reusable logout component
- **Login Forms**: Use NextAuth's `signIn` function

### Backend Components
- **NextAuth Configuration**: `/lib/nextauth.ts` - Main auth configuration
- **API Route**: `/app/api/auth/[...nextauth]/route.ts` - NextAuth API handler
- **Middleware**: Session validation and route protection

## 🚀 Key Features

### ✅ Built-in Session Management
- Automatic JWT token handling
- Secure cookie management
- Session refresh and validation
- Cross-tab synchronization

### ✅ Secure Logout
- Proper session cleanup
- Automatic redirect to login
- Audit logging for security
- No custom logout API needed

### ✅ Frontend-Backend Sync
- Real-time session updates
- Automatic token refresh
- Consistent user state
- Role-based permissions

## 📝 Usage Examples

### 1. Login (Multiple Options)

#### Option A: Using useAuth Hook (Recommended for Forms)
```tsx
import { useAuth } from '@/hooks/use-auth'

function LoginForm() {
  const { login, isLoading } = useAuth()
  
  const handleSubmit = async (data: { email: string; password: string }) => {
    const result = await login(data)
    if (!result.success) {
      console.error('Login failed:', result.error)
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
    </form>
  )
}
```

#### Option B: Using NextAuth signIn Directly
```tsx
import { signIn } from 'next-auth/react'

const handleLogin = async () => {
  const result = await signIn('credentials', {
    email: 'user@example.com',
    password: 'password',
    redirect: false // or true to auto-redirect
  })
  
  if (result?.error) {
    console.error('Login failed:', result.error)
  }
}
```

### 2. Logout (Multiple Options)

#### Option A: Using LogoutButton Component
```tsx
import { LogoutButton } from '@/components/auth/LogoutButton'

function Navigation() {
  return (
    <div>
      {/* Button style */}
      <LogoutButton>Sign Out</LogoutButton>
      
      {/* Link style */}
      <LogoutButton variant="link">Sign Out</LogoutButton>
      
      {/* Custom styling */}
      <LogoutButton 
        className="custom-class"
        callbackUrl="/custom-redirect"
      >
        Custom Logout
      </LogoutButton>
    </div>
  )
}
```

#### Option B: Using useAuth Hook
```tsx
import { useAuth } from '@/hooks/use-auth'

function UserMenu() {
  const { logout, isLoading } = useAuth()
  
  const handleLogout = async () => {
    const result = await logout()
    if (!result.success) {
      console.error('Logout failed:', result.error)
    }
  }
  
  return (
    <button onClick={handleLogout} disabled={isLoading}>
      {isLoading ? 'Signing out...' : 'Sign Out'}
    </button>
  )
}
```

#### Option C: Using NextAuth signOut Directly
```tsx
import { signOut } from 'next-auth/react'

const handleLogout = async () => {
  await signOut({
    callbackUrl: '/auth/login',
    redirect: true
  })
}
```

### 3. Session Management

#### Check Authentication Status
```tsx
import { useAuth } from '@/hooks/use-auth'

function ProtectedComponent() {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    hasRole, 
    hasPermission 
  } = useAuth()
  
  if (isLoading) return <div>Loading...</div>
  if (!isAuthenticated) return <div>Please login</div>
  
  return (
    <div>
      <h1>Welcome, {user?.name}!</h1>
      <p>Role: {user?.role}</p>
      
      {hasRole('ADMIN') && (
        <AdminPanel />
      )}
      
      {hasPermission('users.view') && (
        <UsersList />
      )}
    </div>
  )
}
```

#### Server-Side Session Access
```tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/nextauth'

export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions)
  
  if (!session) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    }
  }
  
  return {
    props: {
      user: session.user,
    },
  }
}
```

## 🔒 Security Features

### Audit Logging
All authentication events are automatically logged:
- Login attempts (success/failure)
- Logout events
- Session updates
- Security errors

### Session Security
- HTTP-only cookies
- Secure flag in production
- SameSite protection
- Automatic expiration
- CSRF protection

### Role-Based Access Control
```tsx
// Check user roles
const { hasRole, hasPermission, isAdmin } = useAuth()

if (hasRole('ADMIN')) {
  // Admin-only functionality
}

if (hasPermission('users.create')) {
  // Permission-based access
}

if (isAdmin) {
  // Quick admin check
}
```

## 🛠️ Configuration

### Environment Variables
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
DATABASE_URL=your-database-url
```

### NextAuth Configuration
The main configuration is in `/lib/nextauth.ts`:

```typescript
export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  providers: [
    CredentialsProvider({
      // Credential validation logic
    })
  ],
  callbacks: {
    jwt: ({ token, user }) => {
      // JWT token customization
    },
    session: ({ session, token }) => {
      // Session object customization
    }
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  }
}
```

## 🔄 Migration from Custom Auth

### What Changed
1. ✅ **Removed custom logout API** - NextAuth handles this internally
2. ✅ **Removed custom logout utilities** - Using NextAuth's `signOut`
3. ✅ **Updated useAuth hook** - Simplified logout logic
4. ✅ **Removed custom logout pages** - NextAuth manages redirects
5. ✅ **Updated components** - Using new LogoutButton and patterns

### What Stayed the Same
1. ✅ **Login flow** - Still uses credentials provider
2. ✅ **User roles and permissions** - RBAC system unchanged
3. ✅ **Session structure** - Same user object and properties
4. ✅ **Database integration** - Prisma and user model unchanged
5. ✅ **API protection** - Middleware and auth checks work the same

## 🚨 Important Notes

### Do NOT
- ❌ Create custom logout APIs
- ❌ Manually manage JWT tokens
- ❌ Use localStorage for session data
- ❌ Implement custom session refresh logic

### DO
- ✅ Use NextAuth's built-in functions
- ✅ Leverage the useAuth hook for convenience
- ✅ Use LogoutButton component for consistency
- ✅ Follow NextAuth best practices
- ✅ Trust NextAuth's security features

## 📚 Additional Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [JWT Strategy Guide](https://next-auth.js.org/configuration/nextjs#jwt-strategy)
- [Credentials Provider](https://next-auth.js.org/providers/credentials)
- [Session Management](https://next-auth.js.org/getting-started/client#usesession)

## 🐛 Troubleshooting

### Common Issues

1. **Session not persisting**
   - Check NEXTAUTH_SECRET is set
   - Verify NEXTAUTH_URL matches your domain
   - Ensure cookies are enabled

2. **Logout not working**
   - Use NextAuth's `signOut` function
   - Don't create custom logout endpoints
   - Check callback URLs are correct

3. **Role checks failing**
   - Ensure JWT callback populates user data
   - Verify session callback returns correct structure
   - Check RBAC permissions are properly configured