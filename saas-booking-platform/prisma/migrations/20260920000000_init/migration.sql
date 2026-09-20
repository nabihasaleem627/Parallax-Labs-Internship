-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ORG_ADMIN', 'STAFF', 'USER');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_subdomain_key" ON "Tenant"("subdomain");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE INDEX "Booking_tenantId_startsAt_idx" ON "Booking"("tenantId", "startsAt");

-- CreateIndex
CREATE INDEX "Booking_tenantId_status_idx" ON "Booking"("tenantId", "status");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Multi-tenancy: application role + Row-Level Security (RLS)
--
-- The application connects as `tenant_app`, a NON-OWNER role. Table owners
-- bypass RLS by default, so using a non-owner role for the app guarantees
-- the policies below are always enforced for every application query.
--
-- Two GUCs (custom settings) drive the policies:
--   app.current_tenant_id        set per-transaction by the application
--                                (withTenantScope in src/lib/db/tenant.ts)
--   app.bypass_tenant_isolation  set ONLY for the short-lived auth lookups
--                                performed before the tenant is known
--                                (login / forgot-password)
-- ---------------------------------------------------------------------------

DO
$$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'tenant_app') THEN
        CREATE ROLE tenant_app LOGIN PASSWORD 'tenant_app_dev_password';
    END IF;
END
$$;

GRANT CONNECT ON DATABASE bookflow TO tenant_app;
GRANT USAGE ON SCHEMA public TO tenant_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO tenant_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO tenant_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO tenant_app;

-- Tenant rows: the app may READ (tenant lookup during auth/onboarding) and
-- INSERT (organization onboarding) but never update or delete — those are
-- reserved for the owner role (and for future subscription tooling).
REVOKE UPDATE, DELETE ON TABLE "Tenant" FROM tenant_app;

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Booking" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PasswordResetToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tenant" ENABLE ROW LEVEL SECURITY;

-- User rows are visible only when the tenant matches the per-transaction GUC.
CREATE POLICY tenant_isolation ON "User"
    USING (
        "User"."tenantId"::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_tenant_isolation', true) = 'on'
    )
    WITH CHECK (
        "User"."tenantId"::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_tenant_isolation', true) = 'on'
    );

CREATE POLICY tenant_isolation ON "Booking"
    USING (
        "Booking"."tenantId"::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_tenant_isolation', true) = 'on'
    )
    WITH CHECK (
        "Booking"."tenantId"::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_tenant_isolation', true) = 'on'
    );

-- Reset tokens are tenant-owned through their user.
CREATE POLICY tenant_isolation ON "PasswordResetToken"
    USING (
        EXISTS (
            SELECT 1 FROM "User" u
            WHERE u.id = "PasswordResetToken"."userId"
              AND u."tenantId"::text = current_setting('app.current_tenant_id', true)
        )
        OR current_setting('app.bypass_tenant_isolation', true) = 'on'
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "User" u
            WHERE u.id = "PasswordResetToken"."userId"
              AND u."tenantId"::text = current_setting('app.current_tenant_id', true)
        )
        OR current_setting('app.bypass_tenant_isolation', true) = 'on'
    );

-- Tenants are readable (auth lookup) and insertable (onboarding) by the app
-- role; all other mutations are blocked by the REVOKEd privileges above.
CREATE POLICY tenant_access ON "Tenant"
    USING (true)
    WITH CHECK (true);
