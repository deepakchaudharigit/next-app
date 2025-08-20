# 🔍 Error Checking Guide for NPCL Dashboard

## 🚀 Quick Commands to Check All Errors

### **1. Quick Error Check (Fast)**
```bash
npm run check:quick
```
This runs a fast check for the most common errors:
- TypeScript compilation errors
- ESLint errors
- Prisma schema validation
- Next.js build errors

### **2. Comprehensive Error Check (Detailed)**
```bash
npm run check:errors
```
This runs a detailed check for all types of errors:
- TypeScript type checking
- ESLint code quality
- Next.js build validation
- Prisma schema validation
- Package dependency issues
- Test file compilation
- Import/export analysis

### **3. Automatic Error Fixing**
```bash
npm run fix:all
```
This attempts to automatically fix common errors:
- Install/update dependencies
- Fix TypeScript configuration
- Add missing type declarations
- Generate Prisma client
- Apply ESLint auto-fixes
- Fix common type errors

## 🎯 Specific Error Checks

### **TypeScript Errors Only**
```bash
npm run type:check
```
Shows all TypeScript compilation errors including:
- Type declaration errors
- Variable type mismatches
- Missing type assertions
- Import/export type issues

### **TypeScript Watch Mode**
```bash
npm run type:check:watch
```
Continuously watches for TypeScript errors as you code.

### **ESLint Errors Only**
```bash
npm run lint
```
Shows ESLint code quality issues.

### **Auto-fix ESLint Issues**
```bash
npm run lint:fix
```
Automatically fixes ESLint issues that can be auto-corrected.

### **Build Errors Only**
```bash
npm run build
```
Shows Next.js build errors and warnings.

### **Prisma Errors Only**
```bash
npx prisma validate
npx prisma generate
```
Validates Prisma schema and generates client.

## 🔧 Common Error Types and Solutions

### **1. TypeScript Declaration Errors**
**Error**: `Cannot find name 'X'` or `Property 'X' does not exist`

**Check**: 
```bash
npm run type:check
```

**Fix**:
- Add proper type declarations
- Import missing types
- Use type assertions where needed

### **2. Variable Type Mismatches**
**Error**: `Type 'X' is not assignable to type 'Y'`

**Check**:
```bash
npm run type:check
```

**Fix**:
- Add proper type annotations
- Use type assertions: `value as Type`
- Fix the actual type mismatch

### **3. Import/Export Errors**
**Error**: `Module not found` or `Cannot resolve module`

**Check**:
```bash
npm run type:check
npm run build
```

**Fix**:
- Check file paths
- Verify module exists
- Update import statements

### **4. ESLint Code Quality Issues**
**Error**: Various code style and quality warnings

**Check**:
```bash
npm run lint
```

**Auto-fix**:
```bash
npm run lint:fix
```

### **5. Build/Compilation Errors**
**Error**: Build fails during `npm run build`

**Check**:
```bash
npm run build
```

**Fix**:
- Fix TypeScript errors first
- Check for missing dependencies
- Verify all imports are correct

## 🐳 Docker-Specific Error Checking

### **Before Docker Build**
```bash
# Check all errors first
npm run check:errors

# Fix any issues
npm run fix:all

# Verify build works
npm run build

# Then try Docker
npm run docker:dev
```

### **Docker Build Errors**
If Docker build fails:

1. **Check local build first**:
   ```bash
   npm run build
   ```

2. **Fix TypeScript errors**:
   ```bash
   npm run type:check
   npm run fix:all
   ```

3. **Clean and rebuild**:
   ```bash
   npm run fix:clean
   npm run build
   ```

4. **Try Docker again**:
   ```bash
   npm run docker:dev
   ```

## 📊 Error Checking Workflow

### **Daily Development Workflow**
```bash
# 1. Quick check before starting work
npm run check:quick

# 2. Fix any issues
npm run fix:all

# 3. Start development
npm run dev
```

### **Before Committing Code**
```bash
# 1. Comprehensive check
npm run check:errors

# 2. Fix all issues
npm run fix:all

# 3. Verify build
npm run build

# 4. Run tests
npm test
```

### **Before Docker Deployment**
```bash
# 1. Full error check
npm run check:errors

# 2. Fix all issues
npm run fix:all

# 3. Verify local build
npm run build

# 4. Test Docker build
npm run docker:dev
```

## 🛠️ Advanced Error Debugging

### **Verbose TypeScript Checking**
```bash
npx tsc --noEmit --pretty --listFiles
```

### **ESLint with Detailed Output**
```bash
npx eslint . --ext .ts,.tsx --format=detailed
```

### **Build with Detailed Analysis**
```bash
npm run build -- --debug
```

### **Prisma Debug Mode**
```bash
DEBUG=prisma:* npx prisma generate
```

## 📁 Files Created for Error Checking

- `check-all-errors.js` - Comprehensive error checker
- `fix-all-errors.js` - Automatic error fixer
- `quick-error-check.js` - Fast error checker
- `types/global.d.ts` - Global type declarations (created by fix script)

## 🎯 Summary Commands

| Command | Purpose | Speed |
|---------|---------|-------|
| `npm run check:quick` | Fast error check | ⚡ Fast |
| `npm run check:errors` | Comprehensive check | 🔍 Detailed |
| `npm run fix:all` | Auto-fix errors | 🔧 Automatic |
| `npm run type:check` | TypeScript only | 📝 Focused |
| `npm run lint:fix` | ESLint auto-fix | ✨ Quick fix |

---

## 🎉 Quick Start

**To check and fix all errors in your project:**

```bash
# 1. Check all errors
npm run check:errors

# 2. Fix automatically
npm run fix:all

# 3. Verify everything works
npm run build

# 4. Ready for Docker!
npm run docker:dev
```