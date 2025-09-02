# Troubleshooting Guide

This guide helps resolve common issues with the NPCL Dashboard, particularly focusing on Lighthouse audits, PWA functionality, and mobile optimization.

## 🚨 Common Issues & Solutions

### 1. Lighthouse Audit Failures

#### Issue: "Chrome prevented page load with an interstitial"
**Cause:** Development server is not running or not accessible.

**Solutions:**

##### Option 1: Manual Server Start
```bash
# 1. Start the development server
npm run dev

# 2. Wait for server to be ready (look for "Ready" message)
# 3. In a new terminal, run Lighthouse
npx lighthouse http://localhost:3000 --view
```

##### Option 2: Automated Audit Script
```bash
# Use our automated script that handles server startup
npm run audit:lighthouse
```

##### Option 3: Check Server Health First
```bash
# Check if server is running and healthy
npm run health:server

# If server is not running, start it
npm run dev
```

#### Issue: "CHROME_INTERSTITIAL_ERROR"
**Cause:** Chrome security restrictions or server not responding.

**Solutions:**
```bash
# 1. Check server status
curl http://localhost:3000

# 2. Try different Chrome flags
npx lighthouse http://localhost:3000 --chrome-flags="--headless --no-sandbox --disable-dev-shm-usage" --view

# 3. Use our automated script with proper flags
npm run audit:lighthouse
```

#### Issue: Port 3000 Already in Use
**Solutions:**
```bash
# Option 1: Kill existing process
npx kill-port 3000

# Option 2: Use different port
PORT=3001 npm run dev
# Then audit with: npx lighthouse http://localhost:3001 --view

# Option 3: Find and kill process manually
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -ti:3000 | xargs kill -9
```

### 2. PWA Issues

#### Issue: PWA Not Installing
**Cause:** Missing PWA requirements or HTTPS requirement.

**Solutions:**
```bash
# 1. Check PWA requirements
npm run audit:pwa

# 2. Verify manifest.json is accessible
curl http://localhost:3000/manifest.json

# 3. Verify service worker is accessible
curl http://localhost:3000/sw.js

# 4. For production, ensure HTTPS is enabled
```

#### Issue: Service Worker Not Registering
**Cause:** Service worker file not found or JavaScript errors.

**Solutions:**
```javascript
// 1. Check browser console for errors
// 2. Verify service worker file exists at /public/sw.js
// 3. Check service worker registration in browser DevTools > Application > Service Workers

// Manual registration test:
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(registration => console.log('SW registered:', registration))
    .catch(error => console.log('SW registration failed:', error))
}
```

#### Issue: PWA Install Prompt Not Showing
**Cause:** PWA criteria not met or prompt already dismissed.

**Solutions:**
```javascript
// 1. Clear browser data and try again
// 2. Check PWA criteria in DevTools > Application > Manifest
// 3. Force install prompt (for testing):

// In browser console:
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  e.prompt()
})
```

### 3. Mobile Optimization Issues

#### Issue: Touch Targets Too Small
**Cause:** Elements smaller than 44px touch target.

**Solutions:**
```css
/* Ensure minimum touch target size */
.touch-target {
  min-height: 44px;
  min-width: 44px;
  padding: 8px;
}

/* Use our touch-optimized components */
import { TouchButton } from '@/components/mobile/TouchOptimized'
```

#### Issue: iOS Safari Viewport Issues
**Cause:** iOS Safari viewport height calculation problems.

**Solutions:**
```css
/* Add to your CSS */
@supports (-webkit-touch-callout: none) {
  .min-h-screen {
    min-height: -webkit-fill-available;
  }
}

/* Prevent zoom on input focus */
input, textarea, select {
  font-size: 16px; /* Prevents zoom on iOS */
}
```

#### Issue: Android Chrome Touch Delays
**Cause:** Default touch-action behavior.

**Solutions:**
```css
/* Add to your CSS */
* {
  touch-action: manipulation;
}

/* For specific elements */
.no-touch-delay {
  touch-action: manipulation;
}
```

### 4. Performance Issues

#### Issue: Slow Loading on Mobile
**Cause:** Large bundle size or unoptimized images.

**Solutions:**
```bash
# 1. Analyze bundle size
npm run build
npx @next/bundle-analyzer

# 2. Use lazy loading components
import { DashboardStatsLazy } from '@/components/lazy/LazyComponents'

# 3. Optimize images
import { OptimizedImage } from '@/components/ui/OptimizedImage'
```

#### Issue: Poor Core Web Vitals
**Cause:** Unoptimized performance.

**Solutions:**
```bash
# 1. Run performance audit
npm run audit:performance

# 2. Enable performance monitoring
# Add to .env:
ENABLE_PERFORMANCE_MONITORING=true
ENABLE_WEB_VITALS=true

# 3. Use performance monitoring component
import { PerformanceMonitor } from '@/components/dashboard/PerformanceMonitor'
```

### 5. Development Server Issues

#### Issue: Server Won't Start
**Cause:** Port conflicts, dependency issues, or configuration problems.

**Solutions:**
```bash
# 1. Clear dependencies and reinstall
npm run fix:clean

# 2. Check for port conflicts
npm run health:server

# 3. Try different port
PORT=3001 npm run dev

# 4. Check Node.js version
npm run health:check

# 5. Reset development environment
npm run reset:dev
```

#### Issue: Hot Reload Not Working
**Cause:** File watching issues or configuration problems.

**Solutions:**
```bash
# 1. Restart development server
# Ctrl+C to stop, then npm run dev

# 2. Clear Next.js cache
rm -rf .next
npm run dev

# 3. Check file permissions (Linux/macOS)
chmod -R 755 .

# 4. Increase file watchers (Linux)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### 6. Database Issues

#### Issue: Prisma Connection Errors
**Cause:** Database not running or connection string issues.

**Solutions:**
```bash
# 1. Check database connection
npm run db:generate

# 2. Reset database
npm run db:push

# 3. Check environment variables
npm run validate:env

# 4. Use Docker database
npm run docker:dev
```

### 7. Authentication Issues

#### Issue: NextAuth Session Errors
**Cause:** Missing environment variables or configuration issues.

**Solutions:**
```bash
# 1. Check environment variables
npm run validate:env

# 2. Generate new NextAuth secret
openssl rand -base64 32

# 3. Fix authentication setup
npm run fix:auth

# 4. Check session in browser
# DevTools > Application > Cookies > next-auth.session-token
```

## 🔧 Diagnostic Commands

### Quick Health Check
```bash
# Check overall system health
npm run health:check
npm run health:server
npm run validate:env
```

### Performance Diagnostics
```bash
# Run all audits
npm run audit:lighthouse
npm run audit:pwa
npm run audit:performance
npm run audit:accessibility
npm run audit:seo
```

### Development Diagnostics
```bash
# Check TypeScript
npm run type:check

# Check linting
npm run lint

# Run tests
npm run test

# Check database
npm run db:generate
```

## 🚀 Quick Fixes

### Reset Everything
```bash
# Nuclear option - reset everything
npm run fix:clean
npm run setup:performance
npm run dev
```

### Fix Common Issues
```bash
# Fix dependencies
npm install

# Fix Prisma
npm run db:generate

# Fix environment
npm run fix:env

# Fix authentication
npm run fix:auth
```

### Test PWA Functionality
```bash
# Complete PWA test
npm run test:pwa

# Manual PWA check
npm run health:server
npm run audit:pwa
```

## 📱 Mobile Testing Checklist

### Before Testing
- [ ] Development server is running (`npm run dev`)
- [ ] Server health check passes (`npm run health:server`)
- [ ] PWA manifest is accessible (`curl http://localhost:3000/manifest.json`)
- [ ] Service worker is accessible (`curl http://localhost:3000/sw.js`)

### Lighthouse Audit
- [ ] Run full audit (`npm run audit:lighthouse`)
- [ ] PWA score > 90 (`npm run audit:pwa`)
- [ ] Performance score > 90 (`npm run audit:performance`)
- [ ] Accessibility score > 90 (`npm run audit:accessibility`)

### Mobile Device Testing
- [ ] Test on real iOS device
- [ ] Test on real Android device
- [ ] Test PWA installation
- [ ] Test offline functionality
- [ ] Test touch interactions

### Browser Testing
- [ ] Chrome (desktop & mobile)
- [ ] Safari (desktop & mobile)
- [ ] Firefox (desktop & mobile)
- [ ] Edge (desktop & mobile)

## 🆘 Getting Help

### Debug Information
When reporting issues, include:

```bash
# System information
npm run health:check

# Server status
npm run health:server

# Environment check
npm run validate:env

# Error logs
npm run dev 2>&1 | tee debug.log
```

### Common Error Patterns

#### "Module not found" errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### "Port already in use" errors
```bash
# Kill process on port 3000
npx kill-port 3000
# Or use different port
PORT=3001 npm run dev
```

#### "Permission denied" errors (Linux/macOS)
```bash
# Fix file permissions
chmod -R 755 .
sudo chown -R $USER:$USER .
```

#### "ENOSPC" errors (Linux)
```bash
# Increase file watchers
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 📞 Support Commands

### Emergency Reset
```bash
# If everything is broken, run this sequence:
npm run docker:down
npm run fix:clean
npm install
npm run setup:performance
npm run db:generate
npm run dev
```

### Verify Installation
```bash
# Verify everything is working:
npm run health:check
npm run health:server
npm run audit:lighthouse
npm run test:pwa
```

This troubleshooting guide should help resolve most common issues. If problems persist, check the browser console for specific error messages and include them when seeking help.