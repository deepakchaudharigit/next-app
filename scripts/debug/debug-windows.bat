@echo off
REM Batch Debug Scripts for Windows
REM Usage: scripts\debug\debug-windows.bat [command]

if "%1"=="" goto help
if "%1"=="help" goto help
if "%1"=="inspect" goto inspect
if "%1"=="debug" goto debug
if "%1"=="verbose" goto verbose
if "%1"=="api" goto api
if "%1"=="prisma" goto prisma
if "%1"=="nextauth" goto nextauth

echo Invalid command: %1
goto help

:help
echo.
echo 🔍 Windows Debug Scripts for NPCL Dashboard
echo.
echo Usage: scripts\debug\debug-windows.bat [command]
echo.
echo Available commands:
echo   inspect   - Start with Node.js inspector (port 9229)
echo   debug     - Start with external debug access
echo   verbose   - Start with verbose logging
echo   api       - Start with API debugging
echo   prisma    - Start with Prisma query debugging
echo   nextauth  - Start with NextAuth debugging
echo   help      - Show this help message
echo.
echo Examples:
echo   scripts\debug\debug-windows.bat inspect
echo   scripts\debug\debug-windows.bat api
echo.
echo After starting, open Chrome and go to: chrome://inspect
echo.
goto end

:inspect
echo 🚀 Starting Next.js with Node.js Inspector...
echo 📍 Inspector will be available at: http://localhost:9229
set NODE_OPTIONS=--inspect
npm run dev
goto end

:debug
echo 🚀 Starting Next.js with external debug access...
echo 📍 External debug access enabled on: 0.0.0.0:9229
set NODE_OPTIONS=--inspect=0.0.0.0:9229
npm run dev
goto end

:verbose
echo 🚀 Starting Next.js with verbose logging...
echo 📍 Verbose logging enabled for all modules
set DEBUG=*
npm run dev
goto end

:api
echo 🚀 Starting Next.js with API debugging...
echo 📍 API debugging enabled
set DEBUG=1
npm run dev
goto end

:prisma
echo 🚀 Starting Next.js with Prisma debugging...
echo 📍 Prisma query debugging enabled
set DEBUG=prisma:*
npm run dev
goto end

:nextauth
echo 🚀 Starting Next.js with NextAuth debugging...
echo 📍 NextAuth debugging enabled
set NEXTAUTH_DEBUG=true
npm run dev
goto end

:end