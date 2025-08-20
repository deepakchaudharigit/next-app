-- Ensure the database exists and is properly configured
-- This script runs after the main database creation

-- Connect to the database (using environment variable)
-- Note: This will use the database name from POSTGRES_DB environment variable

-- Set proper encoding and locale for the current database
-- ALTER DATABASE will be handled by the container initialization

-- Create a test table to verify database is working
CREATE TABLE IF NOT EXISTS _health_check (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT NOW(),
    message TEXT DEFAULT 'Database is healthy'
);

-- Insert a test record
INSERT INTO _health_check (message) VALUES ('Database initialized successfully');

-- Log the successful setup
DO $$
BEGIN
    RAISE NOTICE 'Database is ready for Prisma migrations';
END $$;