# NPCL Dashboard - Security Implementation

## Overview

The NPCL Dashboard implements comprehensive security measures to protect against common web application vulnerabilities and attacks. This document outlines the security features and best practices implemented in the application.

## 🛡️ Security Features

### 1. Rate Limiting

**Implementation**: Multi-layer rate limiting with different strategies for different endpoints.

**Features**:
- **Authentication Rate Limiting**: 5 requests per 15 minutes per IP
- **API Rate Limiting**: 100 requests per minute per user/IP
- **Report Generation**: 10 requests per hour per user
- **Adaptive Rate Limiting**: Adjusts limits based on system load
- **IP Blocking**: Automatic blocking of suspicious IPs
- **Whitelist/Blacklist**: Manual IP management

**Algorithms**:
- Token Bucket (default)
- Sliding Window
- Fixed Window
- Distributed (for multiple instances)

**Configuration**:
```typescript
// Custom rate limiting
await withCustomRateLimit(req, {
  windowMs: 60 * 1000,     // 1 minute
  maxRequests: 50,         // 50 requests
  message: 'Rate limit exceeded'
})
```

### 2. CSRF Protection

**Implementation**: Token-based CSRF protection with origin validation.

**Features**:
- **Token Generation**: Cryptographically secure tokens
- **Origin Validation**: Validates request origin and referer headers
- **Session Binding**: Tokens tied to user sessions
- **Automatic Expiration**: Configurable token TTL
- **Multiple Validation Methods**: Header, body, or cookie-based tokens

**Usage**:
```typescript
// Get CSRF token
const response = await fetch('/api/csrf/token')
const { csrfToken } = await response.json()

// Include in requests
fetch('/api/protected-endpoint', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': csrfToken,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
})
```

**Configuration**:
```typescript
const csrfConfig = {
  tokenLength: 32,
  cookieName: 'csrf-token',
  headerName: 'x-csrf-token',
  tokenTTL: 24 * 60 * 60, // 24 hours
  sameSite: 'strict',
  secure: true,
  trustedOrigins: ['https://yourdomain.com']
}
```

### 3. SQL Injection Prevention

**Implementation**: Multi-layer protection beyond Prisma ORM.

**Features**:
- **Pattern Detection**: 50+ SQL injection patterns
- **Input Sanitization**: Automatic sanitization of dangerous inputs
- **Severity Classification**: Low, medium, high, critical threat levels
- **Real-time Monitoring**: Automatic alerting on injection attempts
- **Request Validation**: Validates all request parameters and body

**Detected Patterns**:
- Classic injection (`' OR '1'='1`)
- Union-based injection (`UNION SELECT`)
- Time-based blind injection (`SLEEP`, `WAITFOR`)
- Boolean-based blind injection
- Error-based injection
- Stacked queries
- Information schema access
- Database function calls

**Usage**:
```typescript
// Validate input
const validation = validateSQLInput(userInput, 'email')
if (!validation.isValid) {
  // Handle threat
  console.log('Threats detected:', validation.threats)
}

// Secure Zod schema
const secureSchema = createSecureZodSchema({
  email: z.string().email(),
  name: z.string().min(1)
})
```

### 4. Security Headers

**Implementation**: Comprehensive security headers on all responses.

**Headers Applied**:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy: [strict policy]`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

**Content Security Policy**:
```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
font-src 'self' https://fonts.gstatic.com;
connect-src 'self';
frame-ancestors 'none'
```

### 5. Authentication & Authorization

**Implementation**: NextAuth.js with enhanced security features.

**Features**:
- **JWT Tokens**: Secure session management
- **Role-Based Access Control**: Admin, Operator, Viewer roles
- **Session Validation**: Middleware-level session checks
- **Password Security**: bcrypt with 12 salt rounds
- **Account Lockout**: Automatic lockout after failed attempts

**Role Hierarchy**:
- **ADMIN**: Full system access
- **OPERATOR**: Power unit management, reports
- **VIEWER**: Read-only access

### 6. Input Validation

**Implementation**: Zod schemas with security enhancements.

**Features**:
- **Type Safety**: TypeScript + Zod validation
- **SQL Injection Protection**: Built into validation schemas
- **XSS Prevention**: Input sanitization
- **Length Limits**: Prevent buffer overflow attacks
- **Format Validation**: Email, phone, URL validation

**Example**:
```typescript
const secureUserSchema = createSecureZodSchema({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100)
})
```

## 🔧 Security Configuration

### Environment Variables

```env
# CSRF Protection
CSRF_STRICT_IP=false
CSRF_TOKEN_TTL=86400

# Rate Limiting
RATE_LIMIT_AUTH_MAX=5
RATE_LIMIT_AUTH_WINDOW=900000
RATE_LIMIT_API_MAX=100
RATE_LIMIT_API_WINDOW=60000

# Security Headers
CSP_REPORT_URI=https://your-domain.com/api/csp-report
HSTS_MAX_AGE=31536000

# Monitoring
SECURITY_ALERTS_ENABLED=true
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
ALERT_EMAIL_RECIPIENTS=security@your-domain.com
```

### Security Middleware Configuration

```typescript
// Apply to all API routes
export default withAuth(async function middleware(req) {
  // 1. SQL Injection Prevention
  // 2. Rate Limiting
  // 3. CSRF Protection
  // 4. Security Headers
  // 5. Authentication & Authorization
})
```

## 🚨 Security Monitoring

### Real-time Alerts

**Triggers**:
- SQL injection attempts
- Rate limit violations
- CSRF token violations
- Suspicious IP activity
- Authentication failures

**Channels**:
- Console logging
- Email notifications
- Slack integration
- Webhook endpoints

### Security Metrics

**Tracked Metrics**:
- Failed authentication attempts
- Rate limit violations
- SQL injection attempts
- CSRF violations
- Blocked IP addresses

**Monitoring Dashboard**:
```typescript
// Get security statistics
const stats = {
  rateLimiting: rateLimitMiddleware.getStats(),
  sqlInjection: sqlInjectionPrevention.getStats(),
  csrf: csrfProtection.getConfig(),
  blockedIPs: rateLimitMiddleware.getStats().blockedIPs
}
```

## 🧪 Security Testing

### Automated Testing

Run comprehensive security tests:

```bash
# Test all security features
npm run test:security

# Test specific features
npm run test:rate-limiting
npm run test:csrf
npm run test:sql-injection
```

### Manual Testing

**Rate Limiting**:
```bash
# Test authentication rate limiting
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/test-login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
done
```

**CSRF Protection**:
```bash
# Test CSRF protection
curl -X POST http://localhost:3000/api/auth/test-login \
  -H "Content-Type: application/json" \
  -H "Origin: https://malicious-site.com" \
  -d '{"email":"test@example.com","password":"test"}'
```

**SQL Injection**:
```bash
# Test SQL injection prevention
curl -X POST http://localhost:3000/api/auth/test-login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin'\''--","password":"test"}'
```

## 🔒 Best Practices

### Development

1. **Always validate inputs** using secure schemas
2. **Use parameterized queries** (Prisma handles this)
3. **Implement proper error handling** without exposing internals
4. **Log security events** for monitoring
5. **Regular security testing** in CI/CD pipeline

### Deployment

1. **Enable HTTPS** in production
2. **Configure security headers** properly
3. **Set up monitoring** and alerting
4. **Regular security audits**
5. **Keep dependencies updated**

### Monitoring

1. **Monitor failed authentication attempts**
2. **Track rate limit violations**
3. **Alert on SQL injection attempts**
4. **Review security logs regularly**
5. **Implement incident response procedures**

## 🚀 Security Checklist

### Pre-deployment

- [ ] All security features enabled
- [ ] Security headers configured
- [ ] Rate limiting tested
- [ ] CSRF protection verified
- [ ] SQL injection prevention tested
- [ ] Authentication working properly
- [ ] Authorization rules enforced
- [ ] Security monitoring configured
- [ ] Incident response plan ready

### Post-deployment

- [ ] Security monitoring active
- [ ] Alerts configured and tested
- [ ] Regular security scans scheduled
- [ ] Log analysis automated
- [ ] Incident response tested
- [ ] Security metrics tracked
- [ ] Regular security reviews scheduled

## 📞 Security Incident Response

### Immediate Actions

1. **Identify the threat** type and severity
2. **Block malicious IPs** if necessary
3. **Enable emergency rate limiting** if under attack
4. **Alert security team** via configured channels
5. **Document the incident** for analysis

### Emergency Procedures

```typescript
// Enable emergency mode
rateLimitMiddleware.enableEmergencyMode()

// Block specific IP
rateLimitMiddleware.blockIP('192.168.1.100', 'Security incident')

// Add to blacklist
rateLimiter.addToBlacklist('ip:192.168.1.100')
```

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheets](https://cheatsheetseries.owasp.org/)
- [NextAuth.js Security](https://next-auth.js.org/configuration/options#security)
- [Prisma Security](https://www.prisma.io/docs/concepts/components/prisma-client/raw-database-access#security)

## 🔄 Security Updates

This security implementation is regularly updated to address new threats and vulnerabilities. Check the changelog for recent security updates and ensure your deployment includes the latest security patches.