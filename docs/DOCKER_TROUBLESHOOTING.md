# Docker Troubleshooting Guide

## Common Docker Desktop Issues on Windows

### Error: "The system cannot find the file specified"

This error occurs when Docker Desktop is not running or not properly installed.

```
unable to get image 'postgres:15-alpine': error during connect: Get "http://%2F%2F.%2Fpipe%2FdockerDesktopLinuxEngine/v1.51/images/postgres:15-alpine/json": open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified.
```

## Quick Fixes

### 1. Automated Fix (Recommended)
```bash
# Check Docker status
npm run docker:check

# Start Docker Desktop (Windows)
npm run docker:start-windows

# Or run the comprehensive fix
scripts/fix-docker-windows.bat
```

### 2. Manual Steps

#### Step 1: Check if Docker Desktop is Installed
1. Search "Docker Desktop" in Windows Start menu
2. If not found, download and install from: https://www.docker.com/products/docker-desktop/

#### Step 2: Start Docker Desktop
1. Open Docker Desktop application
2. Wait for the whale icon to appear in system tray
3. The icon should be solid (not animated) when ready

#### Step 3: Verify Docker is Running
```bash
docker --version
docker info
```

## Common Solutions

### 1. Docker Desktop Not Starting

**Symptoms:**
- Docker Desktop icon not in system tray
- `docker info` command fails
- Application shows "Docker is starting..." indefinitely

**Solutions:**

1. **Restart Docker Desktop:**
   - Right-click Docker Desktop icon in system tray
   - Select "Restart Docker Desktop"
   - Wait 1-2 minutes for restart

2. **Run as Administrator:**
   - Right-click Docker Desktop
   - Select "Run as administrator"

3. **Check Windows Features:**
   - Open "Turn Windows features on or off"
   - Enable these features:
     - ✅ Hyper-V (if available)
     - ✅ Windows Subsystem for Linux
     - ✅ Virtual Machine Platform
   - Restart computer after enabling

### 2. WSL 2 Issues

**Symptoms:**
- Docker Desktop shows WSL 2 errors
- "WSL 2 installation is incomplete"

**Solutions:**

1. **Update WSL 2:**
   ```bash
   wsl --update
   wsl --set-default-version 2
   ```

2. **Install WSL 2 Kernel Update:**
   - Download from: https://aka.ms/wsl2kernel
   - Install and restart computer

3. **Set WSL 2 as Default:**
   ```bash
   wsl --set-default-version 2
   ```

### 3. Hyper-V Conflicts

**Symptoms:**
- VirtualBox or VMware conflicts
- "Hyper-V is not available" errors

**Solutions:**

1. **For VirtualBox Users:**
   - Disable Hyper-V temporarily:
     ```bash
     bcdedit /set hypervisorlaunchtype off
     ```
   - Restart computer
   - Use Docker Desktop with WSL 2 backend instead

2. **Enable Hyper-V (if needed):**
   ```bash
   dism.exe /Online /Enable-Feature:Microsoft-Hyper-V /All
   ```

### 4. Memory and Resource Issues

**Symptoms:**
- Docker containers fail to start
- Out of memory errors
- Slow performance

**Solutions:**

1. **Increase Docker Memory:**
   - Docker Desktop → Settings → Resources
   - Increase Memory to 4GB or more
   - Increase CPU cores to 2 or more

2. **Clean Docker Resources:**
   ```bash
   npm run docker:clean
   # Or manually:
   docker system prune -a
   docker volume prune
   ```

### 5. Network Issues

**Symptoms:**
- Cannot pull Docker images
- Network timeouts
- DNS resolution failures

**Solutions:**

1. **Reset Docker Network:**
   - Docker Desktop → Settings → Troubleshoot
   - Click "Reset to factory defaults"

2. **Configure DNS:**
   - Docker Desktop → Settings → Docker Engine
   - Add DNS configuration:
     ```json
     {
       "dns": ["8.8.8.8", "8.8.4.4"]
     }
     ```

## Diagnostic Commands

### Check Docker Status
```bash
# Check if Docker is installed
docker --version

# Check if Docker daemon is running
docker info

# Test Docker functionality
docker run --rm hello-world

# Check Docker Compose
docker-compose --version
```

### Check System Resources
```bash
# Check Docker disk usage
docker system df

# List running containers
docker ps

# List all containers
docker ps -a

# List images
docker images
```

### Check Windows Features
```powershell
# Check if Hyper-V is enabled
Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V

# Check if WSL is enabled
Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux
```

## Prevention Tips

### 1. Regular Maintenance
```bash
# Weekly cleanup
npm run docker:clean

# Check Docker health
npm run docker:check
```

### 2. Proper Shutdown
- Always stop containers before shutting down:
  ```bash
  npm run docker:down
  ```
- Don't force-quit Docker Desktop

### 3. Keep Updated
- Update Docker Desktop regularly
- Update WSL 2 kernel
- Keep Windows updated

## Emergency Recovery

### Complete Docker Reset
If nothing else works:

1. **Uninstall Docker Desktop:**
   - Windows Settings → Apps → Docker Desktop → Uninstall

2. **Clean Registry (Optional):**
   - Run `regedit` as administrator
   - Delete: `HKEY_LOCAL_MACHINE\SOFTWARE\Docker Inc.`

3. **Reinstall Docker Desktop:**
   - Download latest version
   - Install with default settings
   - Restart computer

4. **Reconfigure:**
   - Enable WSL 2 backend
   - Allocate sufficient resources
   - Test with `docker run hello-world`

## Getting Help

### Automated Diagnostics
```bash
# Run comprehensive check
npm run docker:check

# Windows-specific fix
scripts/fix-docker-windows.bat
```

### Manual Diagnostics
1. Check Docker Desktop logs:
   - `%APPDATA%\Docker\log.txt`
2. Check Windows Event Viewer:
   - Windows Logs → Application
   - Look for Docker-related errors

### Support Resources
- Docker Desktop Documentation: https://docs.docker.com/desktop/
- Docker Community Forum: https://forums.docker.com/
- WSL 2 Documentation: https://docs.microsoft.com/en-us/windows/wsl/

## Project-Specific Commands

After fixing Docker Desktop:

```bash
# Validate environment
npm run validate:env

# Start development environment
npm run docker:dev

# Check application logs
npm run docker:logs:app

# Access application
# http://localhost:3000
```