/**
 * End-to-End Authentication Flow Tests
 * Tests complete user journeys from login to dashboard access
 */

// Skip this test if playwright is not available
let playwright: any
let chromium: any
let Browser: any
let Page: any

try {
  playwright = require('playwright')
  chromium = playwright.chromium
  Browser = playwright.Browser
  Page = playwright.Page
} catch (error) {
  console.warn('Playwright not available, skipping e2e tests')
}

import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { testUser } from '@/__tests__/utils/test-factories'

describe.skip('Authentication Flow E2E Tests', () => {
  let browser: any
  let page: any
  const baseURL = process.env.NEXTAUTH_URL || 'http://localhost:3000'

  beforeAll(async () => {
    if (!chromium) {
      console.log('Skipping e2e tests - Playwright not available')
      return
    }
    browser = await chromium.launch({ headless: true })
  })

  afterAll(async () => {
    if (browser) {
      await browser.close()
    }
  })

  beforeEach(async () => {
    if (!browser) {
      return
    }
    page = await browser.newPage()
  })

  afterEach(async () => {
    if (page) {
      await page.close()
    }
  })

  describe('Login Flow', () => {
    it('should complete full login flow for admin user', async () => {
      if (!chromium) {
        console.log('Skipping test - Playwright not available')
        return
      }
      
      // Arrange
      const userData = testUser({ role: 'ADMIN' })
      const hashedPassword = await hashPassword(userData.password)
      
      // Mock user creation instead of actual database call
      ;(prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'test-user-id',
        ...userData,
        password: hashedPassword,
      })

      // Act & Assert
      await page.goto(`${baseURL}/auth/login`)
      
      // Check login page loads
      await expect(page.locator('h1')).toContainText('Sign in')
      
      // Fill login form
      await page.fill('[name="email"]', userData.email)
      await page.fill('[name="password"]', userData.password)
      
      // Submit form
      await page.click('button[type="submit"]')
      
      // Should redirect to dashboard
      await page.waitForURL(`${baseURL}/dashboard`)
      
      // Check dashboard loads with admin features
      await expect(page.locator('h1')).toContainText('Dashboard')
      await expect(page.locator('[data-testid="admin-panel"]')).toBeVisible()
    })

    it('should handle login with invalid credentials', async () => {
      // Act & Assert
      await page.goto(`${baseURL}/auth/login`)
      
      await page.fill('[name="email"]', 'invalid@example.com')
      await page.fill('[name="password"]', 'wrongpassword')
      
      await page.click('button[type="submit"]')
      
      // Should show error message
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials')
      
      // Should stay on login page
      expect(page.url()).toBe(`${baseURL}/auth/login`)
    })

    it('should redirect unauthenticated users to login', async () => {
      // Act
      await page.goto(`${baseURL}/dashboard`)
      
      // Assert
      await page.waitForURL(/.*\/auth\/login/)
      expect(page.url()).toContain('/auth/login')
      expect(page.url()).toContain('callbackUrl=%2Fdashboard')
    })
  })

  describe('Role-Based Access Control', () => {
    it('should restrict viewer access to admin routes', async () => {
      // Arrange
      const userData = testUser({ role: 'VIEWER' })
      const hashedPassword = await hashPassword(userData.password)
      
      await prisma.user.create({
        data: {
          ...userData,
          password: hashedPassword,
        },
      })

      // Login as viewer
      await page.goto(`${baseURL}/auth/login`)
      await page.fill('[name="email"]', userData.email)
      await page.fill('[name="password"]', userData.password)
      await page.click('button[type="submit"]')
      
      await page.waitForURL(`${baseURL}/dashboard`)
      
      // Try to access admin route
      await page.goto(`${baseURL}/dashboard/users`)
      
      // Should redirect with error
      await page.waitForURL(/.*\/dashboard\?error=unauthorized/)
      await expect(page.locator('[data-testid="error-banner"]')).toContainText('Unauthorized')
    })

    it('should allow operator access to operator routes', async () => {
      // Arrange
      const userData = testUser({ role: 'OPERATOR' })
      const hashedPassword = await hashPassword(userData.password)
      
      await prisma.user.create({
        data: {
          ...userData,
          password: hashedPassword,
        },
      })

      // Login as operator
      await page.goto(`${baseURL}/auth/login`)
      await page.fill('[name="email"]', userData.email)
      await page.fill('[name="password"]', userData.password)
      await page.click('button[type="submit"]')
      
      await page.waitForURL(`${baseURL}/dashboard`)
      
      // Access operator route
      await page.goto(`${baseURL}/dashboard/power-units/create`)
      
      // Should load successfully
      await expect(page.locator('h1')).toContainText('Create Power Unit')
    })
  })

  describe('Session Management', () => {
    it('should maintain session across page refreshes', async () => {
      // Arrange
      const userData = testUser()
      const hashedPassword = await hashPassword(userData.password)
      
      await prisma.user.create({
        data: {
          ...userData,
          password: hashedPassword,
        },
      })

      // Login
      await page.goto(`${baseURL}/auth/login`)
      await page.fill('[name="email"]', userData.email)
      await page.fill('[name="password"]', userData.password)
      await page.click('button[type="submit"]')
      
      await page.waitForURL(`${baseURL}/dashboard`)
      
      // Refresh page
      await page.reload()
      
      // Should still be authenticated
      await expect(page.locator('h1')).toContainText('Dashboard')
      expect(page.url()).toBe(`${baseURL}/dashboard`)
    })

    it('should handle logout correctly', async () => {
      // Arrange
      const userData = testUser()
      const hashedPassword = await hashPassword(userData.password)
      
      await prisma.user.create({
        data: {
          ...userData,
          password: hashedPassword,
        },
      })

      // Login
      await page.goto(`${baseURL}/auth/login`)
      await page.fill('[name="email"]', userData.email)
      await page.fill('[name="password"]', userData.password)
      await page.click('button[type="submit"]')
      
      await page.waitForURL(`${baseURL}/dashboard`)
      
      // Logout
      await page.click('[data-testid="logout-button"]')
      
      // Should redirect to home page
      await page.waitForURL(`${baseURL}/`)
      
      // Try to access protected route
      await page.goto(`${baseURL}/dashboard`)
      
      // Should redirect to login
      await page.waitForURL(/.*\/auth\/login/)
    })
  })

  describe('Performance and Accessibility', () => {
    it('should load login page within performance budget', async () => {
      const startTime = Date.now()
      
      await page.goto(`${baseURL}/auth/login`)
      await page.waitForLoadState('networkidle')
      
      const loadTime = Date.now() - startTime
      
      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000)
    })

    it('should be accessible with keyboard navigation', async () => {
      await page.goto(`${baseURL}/auth/login`)
      
      // Tab through form elements
      await page.keyboard.press('Tab') // Email input
      await expect(page.locator('[name="email"]')).toBeFocused()
      
      await page.keyboard.press('Tab') // Password input
      await expect(page.locator('[name="password"]')).toBeFocused()
      
      await page.keyboard.press('Tab') // Forgot password link
      await expect(page.locator('a[href="/auth/forgot-password"]')).toBeFocused()
      
      await page.keyboard.press('Tab') // Submit button
      await expect(page.locator('button[type="submit"]')).toBeFocused()
    })
  })
})