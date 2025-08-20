# 🔧 Docker Port Conflict Solution

## ❌ **Error Explanation**

The error you're seeing means **port 3000 is already in use** by another process:

```
Error: ports are not available: exposing port TCP 0.0.0.0:3000 -> 127.0.0.1:0: 
listen tcp 0.0.0.0:3000: bind: Only one usage of each socket address is normally permitted.
```

This happens when:
- You have a development server running (`npm run dev`)
- Another Docker container is using port 3000
- Another application is using port 3000

## 🚀 **Quick Solutions**

### **Option 1: Automated Fix (Recommended)**
```bash
# Run the automated fix script
node fix-port-conflict.js

# Or use the batch file (Windows)
docker-port-fix.bat
```

### **Option 2: Manual Steps**

#### **Step 1: Stop Development Server**
If you have `npm run dev` running, stop it:
- Press `Ctrl+C` in the terminal where it's running
- Or close that terminal window

#### **Step 2: Stop Docker Containers**
```bash
# Stop all Docker containers
docker-compose down

# Stop development containers specifically
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down
```

#### **Step 3: Kill Processes Using Port 3000**
```bash
# Check what's using port 3000
netstat -ano | findstr :3000

# Kill Node.js processes
taskkill /IM node.exe /F

# Kill specific process by PID (replace XXXX with actual PID)
taskkill /PID XXXX /F
```

#### **Step 4: Clean Docker**
```bash
# Clean Docker system
docker system prune -f
```

### **Option 3: Change Docker Port**

If port 3000 is persistently occupied, change the Docker port:

1. **Edit `docker-compose.dev.yml`**:
   ```yaml
   services:
     app:
       ports:
         - "3001:3000"  # Change from 3000:3000 to 3001:3000
   ```

2. **Access your app at**: http://localhost:3001

### **Option 4: Run Docker in Background**
```bash
# Run Docker in detached mode (background)
npm run docker:dev:detached

# Check status
docker-compose ps

# View logs
npm run docker:logs
```

## 🔍 **Troubleshooting Steps**

### **Check What's Using Port 3000**
```bash
# Windows
netstat -ano | findstr :3000

# The last column shows the Process ID (PID)
```

### **Find Process Details**
```bash
# Get process name by PID (replace XXXX with actual PID)
tasklist /FI "PID eq XXXX"
```

### **Common Culprits**
- **Next.js dev server** (`npm run dev`)
- **Other Docker containers**
- **VS Code Live Server**
- **Other web development tools**

## ✅ **After Fixing**

Once port 3000 is free:

```bash
# Start Docker development environment
npm run docker:dev

# Or start in background
npm run docker:dev:detached
```

## 🌐 **Access Your Application**

After successful Docker startup:
- **Main App**: http://localhost:3000
- **Health Check**: http://localhost:3000/api/health
- **Database**: localhost:5432 (internal)
- **Redis**: localhost:6379 (internal)

## 🆘 **If Issues Persist**

1. **Restart your computer** (nuclear option but effective)
2. **Use a different port** (edit docker-compose.dev.yml)
3. **Check for hidden processes** using Task Manager
4. **Disable other development tools** temporarily

## 📋 **Prevention Tips**

- Always stop `npm run dev` before running Docker
- Use `npm run docker:down` when finished with Docker
- Consider using different ports for different projects
- Use Docker Desktop to monitor container status

---

## 🎯 **Quick Fix Command**

```bash
# One-liner to fix most issues
taskkill /IM node.exe /F && docker-compose down && npm run docker:dev
```

Your Docker containers built successfully! The issue is just the port conflict. 🎉