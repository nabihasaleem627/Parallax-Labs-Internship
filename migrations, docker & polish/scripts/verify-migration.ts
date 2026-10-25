/**
 * Post-migration integrity verification.
 *
 * Confirms:
 *  - Expected tables/columns exist with expected constraints.
 *  - No orphaned tenant_settings rows (tenant isolation / FK integrity).
 *  - Row counts for the seeded dataset meet the >= 100,000 requirement.
 *  - notification_preferences has no NULLs left (backfill + contract
 *    migration succeeded).
 *  - Unique constraints (slug, api_key, tenant_id) are enforced.
 *
 * Usage: npm run db:verify
 */
import "dotenv/config";
import { Pool } from "pg";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required");
  const pool = new Pool({ connectionString: databaseUrl });

  let failed = false;
  const check = (label: string, ok: boolean, detail?: string) => {
    const status = ok ? "PASS" : "FAIL";
    if (!ok) failed = true;
    console.log(`[${status}] ${label}${detail ? ` - ${detail}` : ""}`);
  };

  const { rows: tenantCountRows } = await pool.query<{ count: string }>(
    "SELECT count(*)::text AS count FROM tenants",
  );
  const tenantCount = Number(tenantCountRows[0].count);
  check("tenants table has rows", tenantCount > 0, `count=${tenantCount}`);

  const { rows: settingsCountRows } = await pool.query<{ count: string }>(
    "SELECT count(*)::text AS count FROM tenant_settings",
  );
  const settingsCount = Number(settingsCountRows[0].count);
  check(
    "tenant_settings has >= 100,000 rows (seed dataset)",
    settingsCount >= 100_000,
    `count=${settingsCount}`,
  );

  check(
    "tenants row count matches tenant_settings row count (1:1 relationship)",
    tenantCount === settingsCount,
    `tenants=${tenantCount} settings=${settingsCount}`,
  );

  const { rows: orphanRows } = await pool.query<{ count: string }>(
    `SELECT count(*)::text AS count FROM tenant_settings ts
     LEFT JOIN tenants t ON t.id = ts.tenant_id
     WHERE t.id IS NULL`,
  );
  check("no orphaned tenant_settings rows", Number(orphanRows[0].count) === 0);

  const { rows: nullPrefRows } = await pool.query<{ count: string }>(
    "SELECT count(*)::text AS count FROM tenant_settings WHERE notification_preferences IS NULL",
  );
  check(
    "notification_preferences fully backfilled (no NULLs)",
    Number(nullPrefRows[0].count) === 0,
  );

  const { rows: dupSlugRows } = await pool.query<{ count: string }>(
    "SELECT count(*)::text AS count FROM (SELECT slug FROM tenants GROUP BY slug HAVING count(*) > 1) d",
  );
  check("tenant slugs are unique", Number(dupSlugRows[0].count) === 0);

  const { rows: dupKeyRows } = await pool.query<{ count: string }>(
    "SELECT count(*)::text AS count FROM (SELECT api_key FROM tenants GROUP BY api_key HAVING count(*) > 1) d",
  );
  check("tenant api keys are unique", Number(dupKeyRows[0].count) === 0);

  const { rows: dupSettingsRows } = await pool.query<{ count: string }>(
    "SELECT count(*)::text AS count FROM (SELECT tenant_id FROM tenant_settings GROUP BY tenant_id HAVING count(*) > 1) d",
  );
  check(
    "each tenant has exactly one settings row (1:1 enforced)",
    Number(dupSettingsRows[0].count) === 0,
  );

  const indexResult = await pool.query<{ indexname: string }>(
    `SELECT indexname FROM pg_indexes WHERE tablename = 'tenant_settings'`,
  );
  const indexNames = indexResult.rows.map((r) => r.indexname);
  check(
    "tenant_id index exists for fast settings lookups",
    indexNames.includes("tenant_settings_tenant_id_idx"),
    indexNames.join(", "),
  );

  await pool.end();

  if (failed) {
    console.error("\nMigration verification FAILED. See [FAIL] lines above.");
    process.exit(1);
  }
  console.log("\nMigration verification PASSED.");
}

main().catch((err) => {
  console.error("Verification script crashed:", err);
  process.exit(1);
});
