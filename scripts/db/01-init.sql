-- NPCL Dashboard Database Initialization Script
-- This script ensures the database and required extensions are properly set up

-- Create the database if it doesn't exist (this is handled by POSTGRES_DB env var)
-- But we can ensure proper encoding and collation

-- Create extensions if they don't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set timezone
SET timezone = 'UTC';

-- Create a simple health check function
CREATE OR REPLACE FUNCTION health_check()
RETURNS TEXT AS $$
BEGIN
    RETURN 'Database is healthy at ' || NOW();
END;
$$ LANGUAGE plpgsql;

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'NPCL Dashboard database initialized successfully at %', NOW();
END $$;