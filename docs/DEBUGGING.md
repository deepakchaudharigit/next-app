# 🔍 Debugging Guide for NPCL Dashboard

This guide covers all debugging methods available in your Next.js project, from basic console logging to advanced VS Code debugging.

## 🚀 Quick Start

### 1. **VS Code Debugging (Recommended)**
1. Open VS Code in your project directory
2. Press `F5` or go to Run & Debug panel
3. Select "🚀 Debug Next.js (Full Stack)"
4. Set breakpoints in your code
5. Start debugging!

### 2. **Command Line Debugging**
```bash
# Start with Node.js inspector
npm run dev:inspect

# Then open Chrome and go to:
chrome://inspect
```

## 🛠️ Available Debug Configurations

### VS Code Debug Configurations

#### 🚀 **Debug Next.js (Full Stack)**
- **Best for:** Complete application debugging
- **Features:** Server + Client debugging, automatic browser launch
- **Use when:** You want to debug both frontend and backend

#### 🔧 **Debug Next.js (Server Only)**
- **Best for:** API routes, server-side code
- **Features:** Server-side debugging only
- **Use when:** Focusing on backend logic, API endpoints

#### 🧪 **Debug Jest Tests**
- **Best for:** Unit and integration tests
- **Features:** Debug test files with breakpoints
- **Use when:** Tests are failing or you need to understand test behavior

#### 🧪 **Debug Current Jest Test**
- **Best for:** Single test file debugging
- **Features:** Debug only the currently open test file
- **Use when:** Working on specific test cases

#### 🔍 **Debug API Route**
- **Best for:** API endpoint debugging
- **Features:** Enhanced logging for API routes
- **Use when:** API endpoints are not working as expected

#### 🗄️ **Debug Prisma**
- **Best for:** Database operations
- **Features:** Prisma query debugging
- **Use when:** Database queries are slow or failing

#### 🐳 **Attach to Docker Container**
- **Best for:** Docker development
- **Features:** Debug code running in Docker
- **Use when:** Using Docker for development

## 🎯 Debugging Different Parts of Your App

### Frontend (React Components)

#### **Method 1: VS Code Breakpoints**
```typescript
// components/auth/LoginForm.tsx
export function LoginForm() {
  const handleSubmit = async (data: LoginData) => {
    debugger; // This will trigger VS Code debugger
    const result = await login(data)
    // Set breakpoint on this line in VS Code
    console.log('Login result:', result)
  }
}
```

#### **Method 2: Browser DevTools**
```typescript
// Use console methods for browser debugging
console.log('User data:', user)
console.table(users) // Great for arrays/objects
console.group('Authentication Flow')
console.log('Step 1: Validating credentials')
console.log('Step 2: Calling API')
console.groupEnd()
```

#### **Method 3: React DevTools**
1. Install React DevTools browser extension
2. Open browser DevTools
3. Go to "Components" or "Profiler" tab
4. Inspect component state and props

### Backend (API Routes)

#### **Method 1: VS Code Debugging**
```typescript
// app/api/auth/login/route.ts
export async function POST(req: NextRequest) {
  const body = await req.json()
  
  // Set breakpoint here
  const user = await prisma.user.findUnique({
    where: { email: body.email }
  })
  
  // Inspect variables in VS Code
  return NextResponse.json({ user })
}
```

#### **Method 2: Enhanced Logging**
```typescript
// lib/logger.ts - Create a debug logger
export const debugLog = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔍 [DEBUG] ${message}`, data ? JSON.stringify(data, null, 2) : '')
  }
}

// Usage in API routes
import { debugLog } from '@/lib/logger'

export async function POST(req: NextRequest) {
  debugLog('Login attempt started')
  const body = await req.json()
  debugLog('Request body', body)
  
  const user = await findUser(body.email)
  debugLog('User found', { id: user?.id, email: user?.email })
}
```

### Database (Prisma)

#### **Method 1: Prisma Debug Logging**
```typescript
// Enable in your environment
// .env.local
DEBUG=prisma:query,prisma:info,prisma:warn,prisma:error
```

#### **Method 2: Query Logging**
```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error']
    : ['error']
})
```

#### **Method 3: Prisma Studio**
```bash
# Open Prisma Studio for visual database debugging
npm run db:studio
```

### Authentication (NextAuth)

#### **Debug NextAuth Issues**
```typescript
// lib/nextauth.ts
export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV === 'development',
  logger: {
    error(code, metadata) {
      console.error('NextAuth Error:', code, metadata)
    },
    warn(code) {
      console.warn('NextAuth Warning:', code)
    },
    debug(code, metadata) {
      console.log('NextAuth Debug:', code, metadata)
    }
  },
  // ... rest of config
}
```

## 🔧 Advanced Debugging Techniques

### 1. **Performance Debugging**

#### **React Performance**
```typescript
// Use React Profiler
import { Profiler } from 'react'

function onRenderCallback(id: string, phase: string, actualDuration: number) {
  console.log('Component render:', { id, phase, actualDuration })
}

export function MyComponent() {
  return (
    <Profiler id="MyComponent" onRender={onRenderCallback}>
      <ExpensiveComponent />
    </Profiler>
  )
}
```

#### **API Performance**
```typescript
// app/api/users/route.ts
export async function GET() {
  const start = performance.now()
  
  const users = await prisma.user.findMany()
  
  const end = performance.now()
  console.log(`Query took ${end - start} milliseconds`)
  
  return NextResponse.json(users)
}
```

### 2. **Network Debugging**

#### **Fetch Debugging**
```typescript
// lib/api-client.ts
const originalFetch = fetch

global.fetch = async (...args) => {
  console.log('🌐 Fetch request:', args[0])
  const response = await originalFetch(...args)
  console.log('🌐 Fetch response:', response.status, response.statusText)
  return response
}
```

### 3. **State Debugging**

#### **Custom Hook Debugging**
```typescript
// hooks/use-debug.ts
import { useEffect, useRef } from 'react'

export function useDebugValue(value: any, label: string) {
  const prevValue = useRef(value)
  
  useEffect(() => {
    if (prevValue.current !== value) {
      console.log(`🔄 ${label} changed:`, {
        from: prevValue.current,
        to: value
      })
      prevValue.current = value
    }
  }, [value, label])
}

// Usage
function MyComponent() {
  const [user, setUser] = useState(null)
  useDebugValue(user, 'User State')
  
  return <div>...</div>
}
```

## 🚨 Common Debugging Scenarios

### 1. **"My API route is not working"**
```bash
# Start with debugging enabled
npm run dev:inspect

# Check these:
# 1. Set breakpoint in API route
# 2. Check request body/headers
# 3. Verify database connection
# 4. Check environment variables
```

### 2. **"Authentication is failing"**
```typescript
// Enable NextAuth debugging
// .env.local
NEXTAUTH_DEBUG=true

// Check:
// 1. NEXTAUTH_SECRET is set
// 2. NEXTAUTH_URL is correct
// 3. Database connection works
// 4. User exists in database
```

### 3. **"Component is not rendering"**
```typescript
// Add debug logging
useEffect(() => {
  console.log('Component mounted:', { props, state })
}, [])

// Check:
// 1. Component is imported correctly
// 2. Props are passed correctly
// 3. Conditional rendering logic
// 4. Error boundaries
```

### 4. **"Database query is slow"**
```bash
# Enable Prisma query logging
DEBUG=prisma:query npm run dev

# Check:
# 1. Query complexity
# 2. Missing indexes
# 3. N+1 query problems
# 4. Use Prisma Studio to inspect data
```

## 🛠️ Debugging Tools & Extensions

### VS Code Extensions (Auto-installed)
- **TypeScript and JavaScript Language Features**
- **Tailwind CSS IntelliSense**
- **Prettier - Code formatter**
- **ESLint**
- **Prisma**
- **Jest**
- **JavaScript Debugger**
- **Thunder Client** (API testing)

### Browser Extensions
- **React Developer Tools**
- **Redux DevTools** (if using Redux)
- **Apollo Client DevTools** (if using GraphQL)

### Command Line Tools
```bash
# Debug specific test
npm run test -- --testNamePattern="LoginForm"

# Debug with coverage
npm run test:coverage

# Type checking in watch mode
npm run type:check:watch

# Lint and fix issues
npm run lint:fix
```

## 📝 Debugging Checklist

### Before You Start Debugging
- [ ] Ensure all dependencies are installed (`npm install`)
- [ ] Environment variables are set correctly
- [ ] Database is running and accessible
- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] No linting errors (`npm run lint`)

### During Debugging
- [ ] Use meaningful console.log messages
- [ ] Set breakpoints at key decision points
- [ ] Check network requests in browser DevTools
- [ ] Verify data flow from API to component
- [ ] Test with different user roles/permissions

### After Debugging
- [ ] Remove debug console.logs
- [ ] Remove debugger statements
- [ ] Add proper error handling
- [ ] Write tests for the fixed issue
- [ ] Update documentation if needed

## 🎯 Pro Tips

1. **Use descriptive console.log messages**
   ```typescript
   // ❌ Bad
   console.log(user)
   
   // ✅ Good
   console.log('🔍 [LoginForm] User after authentication:', user)
   ```

2. **Group related logs**
   ```typescript
   console.group('🔐 Authentication Flow')
   console.log('Step 1: Validating input')
   console.log('Step 2: Checking database')
   console.log('Step 3: Creating session')
   console.groupEnd()
   ```

3. **Use conditional debugging**
   ```typescript
   const DEBUG = process.env.NODE_ENV === 'development'
   
   if (DEBUG) {
     console.log('Debug info:', data)
   }
   ```

4. **Leverage VS Code's debug console**
   - Evaluate expressions during debugging
   - Modify variables on the fly
   - Call functions interactively

5. **Use breakpoint conditions**
   - Right-click breakpoint → Add condition
   - Example: `user.role === 'ADMIN'`

## 🆘 Getting Help

If you're still stuck after trying these debugging methods:

1. **Check the logs** in VS Code terminal
2. **Search for similar issues** in the project's GitHub issues
3. **Create a minimal reproduction** of the problem
4. **Document the steps** you've already tried

Happy debugging! 🐛➡️✨