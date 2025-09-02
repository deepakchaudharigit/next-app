# Quick Start Guide - Mobile & PWA Features

This guide helps you quickly get started with the mobile optimization and PWA features of the NPCL Dashboard.

## 🚀 Quick Setup (5 minutes)

### Step 1: Install Dependencies
```bash
# Install all required dependencies
npm install

# Or use our automated setup
npm run setup:mobile
```

### Step 2: Start Development Server
```bash
# Start the development server
npm run dev

# Or start with automatic setup
npm run start:fresh
```

### Step 3: Verify Everything Works
```bash
# Check server health
npm run health:server

# Test PWA functionality
npm run test:pwa
```

## 🔧 Troubleshooting Lighthouse Issues

### Issue: "Chrome prevented page load with an interstitial"

**Quick Fix:**
```bash
# 1. Make sure server is running
npm run dev

# 2. Wait for "Ready" message, then in new terminal:
npm run health:server

# 3. If server is healthy, run audit:
npm run audit:lighthouse
```

**Alternative Fix:**
```bash
# Use our automated script that handles server startup
npm run audit:lighthouse
```

### Issue: Port 3000 Already in Use

**Quick Fix:**
```bash
# Kill existing process
npx kill-port 3000

# Or use different port
PORT=3001 npm run dev
```

### Issue: PWA Not Working

**Quick Fix:**
```bash
# Check PWA requirements
npm run audit:pwa

# Verify files exist
curl http://localhost:3000/manifest.json
curl http://localhost:3000/sw.js
```

## 📱 Testing Mobile Features

### 1. PWA Installation Test
```bash
# Start server
npm run dev

# Run PWA audit
npm run audit:pwa

# Expected results:
# ✅ PWA score > 90
# ✅ Installable
# ✅ Works offline
```

### 2. Mobile Responsiveness Test
```bash
# Run accessibility audit
npm run audit:accessibility

# Run performance audit
npm run audit:performance

# Test in Chrome DevTools:
# 1. Open DevTools (F12)
# 2. Click device toolbar icon
# 3. Select mobile device
# 4. Test touch interactions
```

### 3. Touch Optimization Test
- Open on mobile device
- Test touch targets (should be 44px minimum)
- Test swipe gestures
- Test pull-to-refresh
- Test haptic feedback

## 🎯 Expected Results

### Lighthouse Scores
- **PWA Score**: 90+ ✅
- **Performance**: 90+ ✅
- **Accessibility**: 90+ ✅
- **Best Practices**: 90+ ✅
- **SEO**: 90+ ✅

### PWA Features
- **Installable**: ✅ Shows install prompt
- **Offline**: ✅ Works without internet
- **Responsive**: ✅ Adapts to all screen sizes
- **Fast**: ✅ Loads quickly on mobile

### Mobile Features
- **Touch Targets**: ✅ 44px minimum
- **Safe Areas**: ✅ Supports notched devices
- **Gestures**: ✅ Swipe, pull-to-refresh
- **Navigation**: ✅ Bottom navigation on mobile

## 🛠 Available Commands

### Development
```bash
npm run dev                 # Start development server
npm run start:fresh         # Setup + start server
npm run health:server       # Check server health
```

### Auditing
```bash
npm run audit:lighthouse    # Full Lighthouse audit
npm run audit:pwa          # PWA-specific audit
npm run audit:performance  # Performance audit
npm run audit:accessibility # Accessibility audit
npm run test:pwa           # Complete PWA test
```

### Setup & Maintenance
```bash
npm run setup:mobile       # Setup mobile features
npm run setup:performance  # Setup performance features
npm run fix:clean          # Reset everything
```

## 📋 Checklist

### Before Testing
- [ ] Dependencies installed (`npm install`)
- [ ] Server starts successfully (`npm run dev`)
- [ ] Server health check passes (`npm run health:server`)
- [ ] Environment variables configured (`.env` file exists)

### PWA Requirements
- [ ] Manifest file accessible (`/manifest.json`)
- [ ] Service worker accessible (`/sw.js`)
- [ ] HTTPS in production
- [ ] Icons in multiple sizes
- [ ] Responsive design

### Mobile Optimization
- [ ] Touch targets ≥ 44px
- [ ] Responsive layout
- [ ] Fast loading (< 3s)
- [ ] Works offline
- [ ] Safe area support

## 🆘 Common Issues & Quick Fixes

### Server Won't Start
```bash
# Clear everything and restart
npm run fix:clean
npm install
npm run dev
```

### Lighthouse Fails
```bash
# Use automated script
npm run audit:lighthouse

# Or manual approach
npm run dev
# Wait for "Ready", then:
npx lighthouse http://localhost:3000 --view
```

### PWA Not Installing
```bash
# Check requirements
npm run audit:pwa

# Clear browser data and try again
# Or test in incognito mode
```

### Touch Issues on Mobile
```bash
# Check CSS classes are applied
# Verify touch-manipulation is enabled
# Test on real device, not just DevTools
```

## 🎉 Success Indicators

### You'll Know It's Working When:
1. **Development server starts** without errors
2. **Lighthouse audit passes** with 90+ scores
3. **PWA install prompt** appears in browser
4. **Mobile navigation** shows on small screens
5. **Touch interactions** feel responsive
6. **Offline mode** works when disconnected

### Browser DevTools Checks:
1. **Application tab** shows manifest and service worker
2. **Network tab** shows cached resources
3. **Console** has no critical errors
4. **Lighthouse tab** shows green scores

## 📞 Getting Help

If you encounter issues:

1. **Check the logs**: Look for error messages in terminal
2. **Run diagnostics**: `npm run health:server`
3. **Check troubleshooting guide**: `docs/TROUBLESHOOTING.md`
4. **Reset everything**: `npm run fix:clean && npm install`

### Debug Information to Collect:
```bash
# System info
npm run health:check

# Server status
npm run health:server

# Environment check
npm run validate:env

# Error logs
npm run dev 2>&1 | tee debug.log
```

## 🚀 Next Steps

Once everything is working:

1. **Customize PWA**: Update manifest.json with your branding
2. **Add Icons**: Create PWA icons in multiple sizes
3. **Test on Devices**: Test on real iOS and Android devices
4. **Deploy**: Deploy to production with HTTPS
5. **Monitor**: Use performance monitoring dashboard

Happy coding! 🎉📱