# Rate Limiting Testing Scripts

This directory contains comprehensive testing tools for the NPCL Dashboard rate limiting functionality.

## Quick Start

### 1. Run All Tests
```bash
# Run comprehensive test suite
node scripts/testing/run-all-rate-limit-tests.js

# Run only manual API tests
node scripts/testing/run-all-rate-limit-tests.js --only-manual

# Run with verbose output
node scripts/testing/run-all-rate-limit-tests.js --verbose
```

### 2. Manual Testing (Node.js)
```bash
# Basic test
node scripts/testing/test-rate-limiting.js

# Test with specific parameters
node scripts/testing/test-rate-limiting.js --email user@npcl.com --attempts 10 --delay 500

# Test against different environment
node scripts/testing/test-rate-limiting.js --url https://your-domain.com
```

### 3. Manual Testing (Bash/curl)
```bash
# Make script executable
chmod +x scripts/testing/test-rate-limiting.sh

# Basic test
./scripts/testing/test-rate-limiting.sh

# Test with parameters
./scripts/testing/test-rate-limiting.sh http://localhost:3000 user@npcl.com wrongpassword 8

# Test with admin token for statistics
ADMIN_TOKEN=your_token ./scripts/testing/test-rate-limiting.sh
```

## Available Scripts

| Script | Purpose | Language |
|--------|---------|----------|
| `run-all-rate-limit-tests.js` | Comprehensive test runner | Node.js |
| `test-rate-limiting.js` | Detailed API testing with analysis | Node.js |
| `test-rate-limiting.sh` | Quick curl-based testing | Bash |

## Test Types

### Unit Tests
- Core rate limiting logic
- Window expiration
- Attempt counting
- Reset functionality

### Integration Tests
- API endpoint protection
- Authentication flow integration
- Admin management endpoints

### Manual Tests
- Real API requests
- Rate limiting behavior verification
- Performance testing
- Statistics monitoring

## Expected Results

### Normal Flow
1. **Attempts 1-5**: Authentication errors (404/401)
2. **Attempt 6+**: Rate limited (429)
3. **After success**: Counter resets
4. **After window**: Automatic reset

### Rate Limited Response
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

## Configuration

Rate limiting is configured via environment variables:

```bash
RATE_LIMIT_WINDOW_MS=900000      # 15 minutes
RATE_LIMIT_MAX_ATTEMPTS=5        # 5 attempts
```

## Troubleshooting

### Common Issues

1. **Server not running**
   ```bash
   # Start the development server
   npm run dev
   ```

2. **Rate limiting not working**
   - Check environment variables
   - Verify configuration in `config/auth.ts`
   - Check application logs

3. **Tests failing**
   ```bash
   # Run with verbose output
   node scripts/testing/run-all-rate-limit-tests.js --verbose
   
   # Check individual test types
   npm test __tests__/lib/rate-limiting.test.ts
   ```

### Debug Mode

Enable debug logging:
```bash
DEBUG=rate-limiting npm run dev
```

## Performance Testing

For load testing, use the comprehensive test runner:

```bash
# High-volume test
node scripts/testing/test-rate-limiting.js --attempts 100 --delay 50

# Concurrent testing (requires additional tools)
# Install artillery: npm install -g artillery
artillery quick --count 10 --num 50 http://localhost:3000/api/auth/test-login
```

## Monitoring

### Statistics Endpoint
```bash
# Get rate limiting statistics (admin only)
curl -X GET http://localhost:3000/api/auth/rate-limit \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Reset Rate Limits
```bash
# Reset all rate limits (admin only)
curl -X DELETE http://localhost:3000/api/auth/rate-limit \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Reset specific rate limit (admin only)
curl -X POST http://localhost:3000/api/auth/rate-limit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"email":"user@example.com","ip":"127.0.0.1"}'
```

## Documentation

For detailed testing instructions, see:
- [docs/testing-rate-limiting.md](../../docs/testing-rate-limiting.md)

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review application logs
3. Verify environment configuration
4. Run tests with verbose output for detailed error information