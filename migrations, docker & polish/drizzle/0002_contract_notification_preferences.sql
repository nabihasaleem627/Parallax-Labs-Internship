-- Contract phase of the notification_preferences expand/contract migration.
--
-- Precondition: scripts/backfill-notification-preferences.ts has already
-- been run and `SELECT count(*) FROM tenant_settings WHERE
-- notification_preferences IS NULL` returns 0 (verified by
-- scripts/verify-migration.ts).
--
-- We avoid a plain `ALTER COLUMN ... SET NOT NULL`, because on older
-- Postgres that statement takes an ACCESS EXCLUSIVE lock for the duration
-- of a full table scan. Instead we use the documented safe pattern:
--   1. Add a NOT VALID CHECK constraint (instant, metadata-only).
--   2. VALIDATE the constraint (scans the table but only takes
--      SHARE UPDATE EXCLUSIVE, which does not block concurrent
--      reads/writes - only concurrent DDL).
--   3. SET NOT NULL - PostgreSQL 12+ can skip its own re-scan because it
--      detects the already-validated CHECK constraint, making this step
--      fast/metadata-only.
--   4. Drop the now-redundant helper CHECK constraint.
--> statement-breakpoint
ALTER TABLE "tenant_settings"
  ADD CONSTRAINT "notification_preferences_not_null_chk"
  CHECK ("notification_preferences" IS NOT NULL) NOT VALID;
--> statement-breakpoint
ALTER TABLE "tenant_settings"
  VALIDATE CONSTRAINT "notification_preferences_not_null_chk";
--> statement-breakpoint
ALTER TABLE "tenant_settings"
  ALTER COLUMN "notification_preferences" SET DEFAULT '{"email":true,"sms":false,"push":true}'::jsonb;
--> statement-breakpoint
ALTER TABLE "tenant_settings"
  ALTER COLUMN "notification_preferences" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "tenant_settings"
  DROP CONSTRAINT "notification_preferences_not_null_chk";
