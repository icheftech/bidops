-- BidOps DB Initialization
-- Runs once on first container start

CREATE SCHEMA IF NOT EXISTS extensions;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "vector" SCHEMA extensions;

-- Grant usage on extensions schema to app user
GRANT USAGE ON SCHEMA extensions TO bidops;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO bidops;
