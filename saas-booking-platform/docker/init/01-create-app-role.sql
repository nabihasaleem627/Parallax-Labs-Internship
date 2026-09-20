-- Runs once when the Postgres container is initialized for the first time.
-- Creates the non-owner application role. The tables are owned by
-- `postgres`, so Row-Level Security is always enforced for `tenant_app`
-- (table owners bypass RLS unless FORCE is used).
DO
$$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'tenant_app') THEN
        CREATE ROLE tenant_app LOGIN PASSWORD 'tenant_app_dev_password';
    END IF;
END
$$;
