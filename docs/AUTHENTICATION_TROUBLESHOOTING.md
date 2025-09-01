# Authentication Troubleshooting Guide

## Common Authentication Issues and Solutions

### 1. 401 Unauthorized Error on `/api/auth/callback/credentials`

**Symptoms:**
- POST request to `http://localhost:3000/api/auth/callback/credentials` returns 401
- Login form submits but authentication fails
- Browser console shows authentication errors

**Root Causes:**
1. **NEXTAUTH_SECRET mismatch** between environment files
2. **Invalid or placeholder NEXTAUTH_SECRET** in Docker environment
3. **Missing environment variables** in Docker container
4. **Database connection issues**

**Solutions:**

#### Quick Fix (Automated)
```bash
# Run the automated fix script
npm run fix:auth

# Validate the configuration
npm run validate:env

# Restart your application
npm run dev
# OR for Docker
npm run docker:dev
```

#### Manual Fix

1. **Check NEXTAUTH_SECRET in both environment files:**
   ```bash
   # Check main environment
   grep NEXTAUTH_SECRET .env
   
   # Check Docker environment
   grep NEXTAUTH_SECRET .env.docker
   ```

2. **Ensure both files have the same valid secret:**
   ```bash
   # Generate a new secret (64+ characters)
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

3. **Update both .env and .env.docker files:**
   ```env
   NEXTAUTH_SECRET="your-generated-secret-here"
   ```

4. **Verify Docker Compose configuration:**
   ```yaml
   # In docker-compose.yml, ensure:
   environment:
     - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
     - NEXTAUTH_URL=http://localhost:3000
   ```

### 2. Environment Variable Issues

**Check if variables are loaded correctly:**
```bash
# In your application container
docker-compose exec app printenv | grep NEXTAUTH
```

**Common issues:**
- `.env.docker` file not found
- Placeholder values not replaced
- Environment variables not passed to container

### 3. Database Connection Issues

**Symptoms:**
- Authentication works but user data not found
- Database connection errors in logs

**Solutions:**
1. **Check database URL format:**
   ```env
   # For Docker (service name)
   DATABASE_URL="postgresql://postgres:password@postgres:5432/npcl-auth-db?schema=public"
   
   # For local development
   DATABASE_URL="postgresql://postgres:password@localhost:5432/npcl-auth-db?schema=public"
   ```

2. **Verify database is running:**
   ```bash
   # Check Docker containers
   docker-compose ps
   
   # Check database connectivity
   docker-compose exec postgres psql -U postgres -d npcl-auth-db -c "SELECT 1;"
   ```

3. **Run database migrations:**
   ```bash
   # In Docker
   docker-compose exec app npx prisma db push
   
   # Locally
   npx prisma db push
   ```

### 4. NextAuth Configuration Issues

**Check NextAuth setup:**

1. **Verify route handler exists:**
   ```
   app/api/auth/[...nextauth]/route.ts
   ```

2. **Check authOptions configuration:**
   ```typescript
   // lib/nextauth.ts should export authOptions
   export const authOptions: NextAuthOptions = {
     // ... configuration
   }
   ```

3. **Verify middleware configuration:**
   ```typescript
   // middleware.ts should allow auth routes
   const publicRoutes = [
     '/api/auth',
     // ... other routes
   ]
   ```

### 5. Docker-Specific Issues

**Common Docker problems:**

1. **Container not using updated environment:**
   ```bash
   # Rebuild containers
   docker-compose down
   docker-compose up --build
   ```

2. **Volume mounting issues:**
   ```bash
   # Check if .env.docker is accessible
   docker-compose exec app cat .env.docker
   ```

3. **Network connectivity:**
   ```bash
   # Test internal connectivity
   docker-compose exec app curl http://localhost:3000/api/health
   ```

## Diagnostic Commands

### Environment Validation
```bash
# Validate all environment files
npm run validate:env

# Fix common authentication issues
npm run fix:auth
```

### Docker Diagnostics
```bash
# Check container logs
npm run docker:logs:app

# Check database logs
npm run docker:logs:db

# Access container shell
npm run docker:shell

# Check environment variables in container
docker-compose exec app printenv | grep -E "(NEXTAUTH|DATABASE)"
```

### Database Diagnostics
```bash
# Check database connection
npm run docker:shell:db

# Reset database (if needed)
npm run docker:db:reset

# Seed database
npm run docker:db:seed
```

## Prevention

### 1. Use Environment Validation
Always run validation before starting:
```bash
npm run validate:env && npm run dev
```

### 2. Keep Environment Files in Sync
When updating secrets, update both files:
- `.env` (for local development)
- `.env.docker` (for Docker deployment)

### 3. Use Strong Secrets
Generate cryptographically secure secrets:
```bash
# Generate 64-byte secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Regular Health Checks
Monitor authentication health:
```bash
# Check API health
curl http://localhost:3000/api/health

# Check authentication endpoint
curl http://localhost:3000/api/auth/session
```

## Getting Help

If you're still experiencing issues:

1. **Run full diagnostics:**
   ```bash
   npm run validate:env
   npm run docker:logs:app
   ```

2. **Check the application logs** for specific error messages

3. **Verify your environment setup** matches the examples in `.env.example`

4. **Test with a fresh container:**
   ```bash
   npm run docker:down:volumes
   npm run docker:dev
   ```

## Security Notes

- Never commit real secrets to version control
- Use different secrets for different environments
- Rotate secrets regularly in production
- Monitor authentication logs for suspicious activity