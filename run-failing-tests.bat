@echo off
echo Running previously failing tests...
echo.

echo 1. Testing auth-enhanced...
npx jest __tests__/lib/auth-enhanced.test.ts --verbose
echo.

echo 2. Testing auth basic...
npx jest __tests__/lib/auth.test.ts --verbose
echo.

echo 3. Testing rate limiting...
npx jest __tests__/lib/rate-limiting.test.ts --verbose
echo.

echo 4. Testing API rate limiting...
npx jest __tests__/api/auth/rate-limiting.test.ts --verbose
echo.

echo 5. Testing login integration...
npx jest __tests__/api/auth/login.integration.test.ts --verbose
echo.

echo All tests completed.
pause