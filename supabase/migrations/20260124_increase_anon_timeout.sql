-- Increase timeout for anon role so Python script doesn't timeout
-- This allows the Python backfill script to run longer queries

ALTER ROLE anon SET statement_timeout = '5min';

-- Reload PostgREST to apply changes
NOTIFY pgrst, 'reload config';

-- Verify the change
SELECT rolname, rolconfig
FROM pg_roles
WHERE rolname = 'anon';
