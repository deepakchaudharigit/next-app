# NPCL Dashboard Database Setup Guide

## Problem
Your Next.js application is trying to connect to a PostgreSQL database at `postgres:5432`, but this hostname only exists inside Docker containers. When running `npm run dev` directly, the app can't find the database.

## Solutions

### Option 1: Use Docker (Recommended) ⭐

This is the easiest and most reliable approach since your project is already fully dockerized.

#### Windows:
```bash
# Run the complete application stack
./run-dev.bat

# Or manually:
docker-compose up --build
```

#### Linux/Mac:
```bash
# Make script executable
chmod +x run-dev.sh

# Run the complete application stack
./run-dev.sh

# Or manually:
docker-compose up --build
```

**What this does:**
- Starts PostgreSQL database on port 5432
- Starts Redis cache on port 6379
- Builds and starts your Next.js application on port 3000
- Automatically runs database migrations and seeding
- Sets up proper networking between services

**Access URLs:**
- Application: http://localhost:3000
- Prisma Studio: http://localhost:5555

---

### Option 2: Local Database + npm run dev

If you prefer to run the Next.js app directly with `npm run dev`, you need a local PostgreSQL database.

#### Step 1: Start PostgreSQL Database Only

**Windows:**
```bash
./setup-local-db.bat
```

**Linux/Mac:**
```bash
chmod +x setup-local-db.sh
./setup-local-db.sh
```

#### Step 2: Run the Application
```bash
npm run dev
```

**What this does:**
- Starts only the PostgreSQL container from your Docker setup
- Updates your `.env.local` to use `localhost:5432` instead of `postgres:5432`
- Generates Prisma client
- Sets up database schema
- Seeds initial data

---

## Environment Configuration

Your project has multiple environment files for different scenarios:

| File | Purpose | Database URL |
|------|---------|--------------|
| `.env.local` | Local development (npm run dev) | `localhost:5432` |
| `.env.docker` | Docker development | `postgres:5432` |
| `.env` | Host-based Prisma CLI | `localhost:5432` |

## Troubleshooting

### Issue: "Can't reach database server at postgres:5432"
**Cause:** Running `npm run dev` but database URL points to Docker hostname
**Solution:** Use Option 1 (Docker) or Option 2 (Local setup)

### Issue: "Port 5432 already in use"
**Cause:** Another PostgreSQL instance is running
**Solution:** 
```bash
# Stop other PostgreSQL services
docker-compose down
# Or stop system PostgreSQL service
```

### Issue: "Database does not exist"
**Cause:** Database hasn't been created yet
**Solution:**
```bash
npx prisma db push
npm run db:seed
```

### Issue: "Prisma client not generated"
**Cause:** Prisma client needs to be regenerated
**Solution:**
```bash
npx prisma generate
```

## Quick Commands

```bash
# Check if database is running
docker-compose ps

# View database logs
docker-compose logs postgres

# Connect to database directly
docker-compose exec postgres psql -U postgres -d npcl-auth-db-dev

# Reset everything and start fresh
docker-compose down -v
docker-compose up --build

# Run only database for local development
docker-compose up -d postgres

# Stop all services
docker-compose down
```

## Recommended Workflow

1. **For full development:** Use `docker-compose up --build`
2. **For quick testing:** Use local database + `npm run dev`
3. **For production:** Use the production Docker configuration

## Next Steps

After fixing the database connection:
1. Visit http://localhost:3000
2. Register a new user account
3. Check the dashboard functionality
4. Use Prisma Studio at http://localhost:5555 to view database data

## Support

If you continue to have issues:
1. Check Docker is running: `docker --version`
2. Check ports are available: `netstat -an | findstr 5432`
3. Verify environment variables: `cat .env.local`
4. Check application logs for specific error messages