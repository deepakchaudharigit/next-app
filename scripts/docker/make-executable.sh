#!/bin/bash

echo "Making all Docker scripts executable..."

chmod +x scripts/docker/startup-dev.sh
chmod +x scripts/docker/test-db-connection.sh
chmod +x scripts/docker/debug-env.sh
chmod +x scripts/docker/fix-and-restart.sh
chmod +x scripts/docker/health-check.sh
chmod +x scripts/docker/make-executable.sh
chmod +x scripts/docker/switch-dockerfile.sh
chmod +x scripts/docker/troubleshoot-prisma.sh
chmod +x scripts/docker/fix-prisma-openssl.sh

echo "✅ All scripts are now executable!"

echo ""
echo "Available scripts:"
echo "  startup-dev.sh         - Main development startup script"
echo "  test-db-connection.sh  - Test database connectivity"
echo "  debug-env.sh           - Debug environment variables"
echo "  fix-and-restart.sh     - Automated fix and restart"
echo "  health-check.sh        - Comprehensive health check"
echo "  switch-dockerfile.sh   - Switch between Alpine/Debian images"
echo "  troubleshoot-prisma.sh - Diagnose Prisma problems"
echo "  fix-prisma-openssl.sh  - Complete fix for OpenSSL issues"