# NPCL Dashboard - Complete Docker Fix Guide

## 🚨 Issues Fixed

### 1. PowerShell Script Syntax Errors
- **Problem**: Original script had broken variable syntax and logic errors
- **Solution**: Created proper PowerShell and batch scripts with error handling

### 2. Docker Build Hanging
- **Problem**: `RUN chown -R node:node /app` was hanging due to permission conflicts
- **Solution**: Fixed Dockerfile.dev to handle permissions properly before copying files

### 3. Port Conflicts
- **Problem**: Process on port 3000 not properly killed
- **Solution**: Improved port cleanup scripts with better process detection

### 4. Database Connection Issues
- **Problem**: Startup script had insufficient timeout and error handling
- **Solution**: Enhanced startup script with better error handling and longer timeouts

## 🛠️ Quick Fix Options

### Option 1: Use the Complete PowerShell Fix (Recommended)
```powershell
.\fix-docker-complete.ps1
```

### Option 2: Use the Simple Batch Script
```cmd
fix-docker-simple.bat
```

### Option 3: Quick Port Fix Only
```cmd
quick-port-fix.bat
```

### Option 4: Manual Commands
```cmd
# Stop containers
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down -v --remove-orphans

# Kill port 3000 processes
for /f "tokens=5" %a in ('netstat -ano ^| findstr :3000') do taskkill /PID %a /F

# Clean Docker
docker system prune -f

# Restart
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build --force-recreate
```

## 🔧 What Was Fixed

### 1. Dockerfile.dev Improvements
- ✅ Fixed permission issues that caused build hanging
- ✅ Proper user creation and ownership handling
- ✅ Better layer caching for faster rebuilds

### 2. Startup Script Enhancements
- ✅ Increased PostgreSQL wait timeout (60 attempts vs 30)
- ✅ Better error handling and logging
- ✅ Environment validation
- ✅ Graceful shutdown handling

### 3. Port Conflict Resolution
- ✅ Proper process detection and killing
- ✅ Multiple port cleanup (3000, 5432, 6379)
- ✅ Error handling for failed kills

### 4. Docker Compose Improvements
- ✅ Better volume handling
- ✅ Proper dependency management
- ✅ Enhanced health checks

## 🚀 Next Steps

1. **Run the fix script**: Choose one of the options above
2. **Wait for build**: First build may take 5-10 minutes
3. **Check logs**: Monitor the output for any errors
4. **Verify setup**: Visit http://localhost:3000 when ready

## 🔍 Troubleshooting

### If Docker build still hangs:
```cmd
# Force clean everything
docker-compose down -v
docker system prune -a -f
docker volume prune -f

# Restart Docker Desktop
# Then try again
```

### If port 3000 is still in use:
```cmd
# Find and kill all Node.js processes
tasklist | findstr node
taskkill /IM node.exe /F

# Or restart your computer
```

### If database connection fails:
```cmd
# Check if PostgreSQL container is running
docker-compose ps

# Check PostgreSQL logs
docker-compose logs postgres

# Reset database
docker-compose exec app npx prisma db push --force-reset
```

## 📋 Verification Checklist

After running the fix:

- [ ] Docker containers are running: `docker-compose ps`
- [ ] Port 3000 is accessible: `curl http://localhost:3000/api/health`
- [ ] Database is connected: Check app logs for "PostgreSQL is ready!"
- [ ] No permission errors in logs
- [ ] Hot reloading works (edit a file and see changes)

## 🆘 If All Else Fails

1. **Restart Docker Desktop completely**
2. **Restart your computer**
3. **Use the nuclear option**:
   ```cmd
   docker system prune -a -f --volumes
   docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build --force-recreate
   ```

## 📞 Support

If you're still having issues:
1. Check the Docker Desktop logs
2. Run `docker version` to ensure Docker is working
3. Try running without Docker: `npm run dev` (after setting up local PostgreSQL)
4. Check Windows Defender/Antivirus isn't blocking Docker

---

**Note**: The fixes preserve all your existing code and configuration. Only Docker setup and scripts were modified.