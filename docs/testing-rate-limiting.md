# Rate Limiting Testing Guide

This guide provides comprehensive instructions for testing the rate limiting functionality in the NPCL Dashboard.

## Overview

The NPCL Dashboard implements rate limiting for authentication attempts to prevent brute force attacks. The default configuration allows:

- **5 failed attempts** per email/IP combination
- **15-minute window** for rate limiting
- **Automatic reset** after successful authentication

## Configuration

Rate limiting is configured in `config/env.server.ts`:

```typescript
RATE_LIMIT_WINDOW_MS: 900000,     // 15 minutes (900,000 ms)
RATE_LIMIT_MAX_ATTEMPTS: 5,      // 5 attempts
```

You can override these values using environment variables:

```bash
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_ATTEMPTS=5
```

## Testing Methods

### 1. Automated Testing with Jest

Use the Jest test suites for comprehensive rate limiting testing:

```bash
# Run all rate limiting tests
npm run test:security

# Run specific rate limiting unit tests
npm test __tests__/lib/rate-limiting.test.ts

# Run API integration tests
npm test __tests__/api/auth/rate-limiting.test.ts

# Run live server tests
npm run test:live
```

### 2. Manual API Testing

#### Using curl

Test the rate limiting manually using curl:

```bash
# Make multiple failed login attempts
for i in {1..10}; do
  echo "Attempt $i:"
  curl -X POST http://localhost:3000/api/auth/test-login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrongpassword"}' \
    -w "Status: %{http_code}\n" \
    -s | jq '.message, .rateLimitInfo'
  echo "---"
  sleep 1
done
```

#### Using Postman

1. Create a new POST request to `http://localhost:3000/api/auth/test-login`
2. Set headers: `Content-Type: application/json`
3. Set body (raw JSON):
   ```json
   {
     "email": "test@example.com",
     "password": "wrongpassword"
   }
   ```
4. Send the request multiple times to trigger rate limiting

### 3. Unit Tests

Run the unit tests to verify core functionality:

```bash
# Run rate limiting specific tests
npm test __tests__/lib/rate-limiting.test.ts

# Run all authentication tests
npm test __tests__/api/auth/

# Run with coverage
npm run test:coverage
```

### 4. Integration Testing

Test the complete authentication flow:

```bash
# Run integration tests
npm test __tests__/api/auth/rate-limiting.test.ts

# Run all API tests
npm run test:api
```

## Expected Behavior

### Normal Operation

1. **First 5 attempts**: Should return appropriate error messages (404 for user not found, 401 for invalid password)
2. **6th attempt and beyond**: Should return HTTP 429 with rate limit error
3. **After successful login**: Rate limit counter should reset
4. **After time window**: Rate limit should automatically reset

### Rate Limited Response

When rate limited, the API returns:

```json
{
  "success": false,
  "error": "Too many authentication attempts. Please try again later.",
  "code": "RATE_LIMITED",
  "rateLimitInfo": {
    "remaining": 0,
    "resetTime": "2024-01-27T12:15:00.000Z",
    "totalAttempts": 6,
    "retryAfter": 847
  }
}
```

## Monitoring and Administration

### Rate Limiting Statistics

Get current rate limiting statistics (admin only):

```bash
curl -X GET http://localhost:3000/api/auth/rate-limit \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

Response:
```json
{
  "success": true,
  "data": {
    "statistics": {
      "totalTrackedIdentifiers": 3,
      "blockedIdentifiers": 1,
      "totalAttempts": 15,
      "oldestAttempt": "2024-01-27T12:00:00.000Z"
    },
    "configuration": {
      "windowMs": 900000,
      "maxAttempts": 5,
      "windowMinutes": 15
    }
  }
}
```

### Reset Rate Limits

#### Reset All Rate Limits (Admin Only)

```bash
curl -X DELETE http://localhost:3000/api/auth/rate-limit \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### Reset Specific Rate Limit (Admin Only)

```bash
curl -X POST http://localhost:3000/api/auth/rate-limit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"email":"user@example.com","ip":"127.0.0.1"}'
```

## Testing Scenarios

### Scenario 1: Basic Rate Limiting

1. Make 5 failed login attempts with the same email
2. Verify each attempt returns appropriate error (not rate limited)
3. Make 6th attempt
4. Verify it returns HTTP 429 with rate limit error

### Scenario 2: Different IP Addresses

1. Make 5 failed attempts from IP A
2. Make 1 attempt from IP B with same email
3. Verify IP B is not rate limited
4. Verify IP A is still rate limited

### Scenario 3: Successful Authentication Reset

1. Make 3 failed attempts
2. Make 1 successful attempt
3. Make another failed attempt
4. Verify counter has reset (should be allowed)

### Scenario 4: Time Window Expiration

1. Make 5 failed attempts
2. Wait for rate limit window to expire (15 minutes in production, shorter in tests)
3. Make another attempt
4. Verify rate limit has reset

### Scenario 5: Multiple Users

1. Make 5 failed attempts for user A
2. Make 1 attempt for user B
3. Verify user B is not affected by user A's rate limit

## Performance Testing

### Load Testing

Test rate limiting under load:

```bash
# Install artillery for load testing
npm install -g artillery

# Create artillery config
cat > rate-limit-load-test.yml << EOF
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "Rate limit test"
    requests:
      - post:
          url: "/api/auth/test-login"
          json:
            email: "load-test@example.com"
            password: "wrongpassword"
EOF

# Run load test
artillery run rate-limit-load-test.yml
```

### Memory Usage Testing

Monitor memory usage during rate limiting:

```bash
# Monitor Node.js process during live tests
node --inspect node_modules/.bin/jest --config=jest.config.live.cjs
```

## Troubleshooting

### Common Issues

1. **Rate limiting not working**
   - Check environment variables are set correctly
   - Verify rate limiting is enabled in configuration
   - Check for errors in application logs

2. **Rate limits not resetting**
   - Verify time window configuration
   - Check system clock synchronization
   - Look for memory leaks in rate limiter

3. **False positives**
   - Check IP detection logic
   - Verify email normalization (lowercase)
   - Review rate limiting key generation

### Debug Mode

Enable debug logging for rate limiting:

```bash
# Set environment variable
DEBUG=rate-limiting npm run dev

# Or in code
process.env.DEBUG = 'rate-limiting'
```

### Logs to Monitor

Check these log entries:

- `login_rate_limited` - When rate limiting is triggered
- `login_failed` - Failed authentication attempts
- `rate_limit_reset_all` - When admin resets all limits
- `rate_limit_reset_specific` - When admin resets specific limit

## Security Considerations

### Best Practices

1. **Don't reveal user existence** - Rate limiting should not indicate whether an email exists
2. **Use IP + email combination** - Prevents easy bypassing by changing emails
3. **Monitor for patterns** - Look for distributed attacks across IPs
4. **Implement progressive delays** - Consider increasing delays for repeated offenders

### Production Recommendations

1. **Use Redis for distributed systems** - For multi-instance deployments
2. **Implement IP whitelisting** - For trusted networks
3. **Add CAPTCHA after rate limiting** - Additional protection layer
4. **Monitor and alert** - Set up alerts for high rate limiting activity

## Metrics and Monitoring

### Key Metrics to Track

- Rate limiting trigger frequency
- Average attempts before rate limiting
- Rate limiting reset frequency
- Geographic distribution of rate limited IPs
- Time patterns of rate limiting events

### Grafana Dashboard Queries

If using Grafana for monitoring:

```sql
-- Rate limiting events over time
SELECT time, count(*) 
FROM audit_logs 
WHERE action = 'login_rate_limited' 
GROUP BY time(5m)

-- Top rate limited emails
SELECT details->>'email', count(*) 
FROM audit_logs 
WHERE action = 'login_rate_limited' 
GROUP BY details->>'email' 
ORDER BY count DESC 
LIMIT 10
```

## Conclusion

Rate limiting is a critical security feature that requires thorough testing. Use the provided tools and follow the testing scenarios to ensure your implementation is working correctly. Regular monitoring and testing help maintain the security posture of your application.

For questions or issues, refer to the application logs and consider the troubleshooting section above.