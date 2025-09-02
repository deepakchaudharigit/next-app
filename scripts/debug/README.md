# 🔍 Windows Debug Scripts

These scripts provide Windows-compatible debugging options that work immediately without requiring additional dependencies.

## 🚀 Quick Start

### **Batch Script (Recommended for Windows)**
```cmd
# Basic debugging
scripts\debug\debug-windows.bat inspect

# API debugging
scripts\debug\debug-windows.bat api

# Database debugging
scripts\debug\debug-windows.bat prisma

# Authentication debugging
scripts\debug\debug-windows.bat nextauth
```

### **PowerShell Script**
```powershell
# Basic debugging
.\scripts\debug\debug-windows.ps1 inspect

# API debugging
.\scripts\debug\debug-windows.ps1 api

# Database debugging
.\scripts\debug\debug-windows.ps1 prisma

# Authentication debugging
.\scripts\debug\debug-windows.ps1 nextauth
```

## 📋 Available Commands

| Command | Description | Port/Access |
|---------|-------------|-------------|
| `inspect` | Node.js Inspector | localhost:9229 |
| `debug` | External Debug Access | 0.0.0.0:9229 |
| `verbose` | Verbose Logging | All modules |
| `api` | API Debugging | API routes |
| `prisma` | Database Debugging | Prisma queries |
| `nextauth` | Auth Debugging | NextAuth flows |
| `help` | Show Help | - |

## 🔧 After Starting

1. **Open Chrome**
2. **Go to:** `chrome://inspect`
3. **Click:** "Open dedicated DevTools for Node"
4. **Set breakpoints** in your code
5. **Start debugging!**

## 🆘 Troubleshooting

### **PowerShell Execution Policy**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### **Batch Script Not Working**
- Make sure you're in the project root directory
- Use forward slashes: `scripts\debug\debug-windows.bat inspect`

### **Port Already in Use**
- Kill existing Node processes
- Use a different port in the script
- Restart your terminal

## 🔄 Alternative Methods

If these scripts don't work, you can also use:

1. **Windows npm scripts:** `npm run dev:inspect:win`
2. **VS Code debugging:** Press `F5` in VS Code
3. **Manual environment variables:**
   ```cmd
   set NODE_OPTIONS=--inspect
   npm run dev
   ```

## 📚 More Information

See the complete debugging guide: `docs/DEBUGGING.md`