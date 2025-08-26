@echo off
echo Setting up local PostgreSQL database for NPCL Dashboard...
echo.

REM Start only the PostgreSQL service from Docker
echo Starting PostgreSQL database...
docker-compose up -d postgres

REM Wait for database to be ready
echo Waiting for database to be ready...
timeout /t 10 /nobreak > nul

REM Generate Prisma client
echo Generating Prisma client...
npx prisma generate

REM Push database schema
echo Setting up database schema...
npx prisma db push

REM Seed the database
echo Seeding database with initial data...
npm run db:seed

echo.
echo Database setup complete!
echo You can now run: npm run dev
echo.
echo To stop the database later, run: docker-compose stop postgres
pause