/**
 * Reproducible seeding script.
 *
 * Creates a deterministic set of "demo" tenants (small, friendly, used by
 * the UI for manual testing) plus a large batch of synthetic tenants used
 * to exercise migrations/queries/indexes at realistic scale (>= 100,000
 * rows total in tenant_settings).
 *
 * Batched inserts (default 1,000 rows/statement) are used instead of a
 * single multi-hundred-thousand-row INSERT or row-by-row inserts, which
 * keeps memory usage low and avoids a single oversized statement/transaction
 * that could block other traffic for an extended period.
 *
 * Usage:
 *   npm run db:seed                 # seeds demo tenants + 100,000 bulk tenants
 *   SEED_BULK_COUNT=500000 npm run db:seed   # override bulk row count
 *   SEED_RESET=true npm run db:seed # wipe tables first (local/dev only)
 */
import "dotenv/config";
import { Pool } from "pg";
import { randomBytes } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const BATCH_SIZE = 1000;
const BULK_COUNT = Number(process.env.SEED_BULK_COUNT ?? 100_000);
const RESET = process.env.SEED_RESET === "true";

const THEMES = ["light", "dark", "system"] as const;
const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Kolkata",
  "Australia/Sydney",
];
const LANGUAGES = ["en", "es", "fr", "de", "ja", "pt"];

function apiKey(): string {
  return randomBytes(24).toString("base64url");
}

// Deterministic "random" picker seeded by index so re-running the script
// without SEED_RESET produces the same values for the same tenant slug
// (idempotent re-seeding thanks to ON CONFLICT DO NOTHING).
function pick<T>(arr: readonly T[], seed: number): T {
  return arr[seed % arr.length];
}

const DEMO_TENANTS = [
  { slug: "acme", name: "Acme Corporation" },
  { slug: "globex", name: "Globex Industries" },
  { slug: "initech", name: "Initech" },
  { slug: "umbrella", name: "Umbrella Labs" },
  { slug: "stark", name: "Stark Innovations" },
];

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required");

  const pool = new Pool({ connectionString: databaseUrl, max: 5 });
  const client = await pool.connect();

  try {
    if (RESET) {
      console.log("SEED_RESET=true -> truncating tenants & tenant_settings ...");
      await client.query("TRUNCATE TABLE tenant_settings, tenants RESTART IDENTITY CASCADE");
    }

    console.log(`Seeding ${DEMO_TENANTS.length} demo tenants ...`);
    const demoKeys: Record<string, string> = {};
    for (const tenant of DEMO_TENANTS) {
      const key = apiKey();
      const tenantResult = await client.query<{ id: number; api_key: string }>(
        `INSERT INTO tenants (slug, name, api_key)
         VALUES ($1, $2, $3)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
         RETURNING id, api_key`,
        [tenant.slug, tenant.name, key],
      );
      const tenantId = tenantResult.rows[0].id;
      demoKeys[tenant.slug] = tenantResult.rows[0].api_key;
      // Intentionally omit notification_preferences here: seeded rows start
      // out representing "pre-expand-migration" legacy data. Running
      // `npm run db:backfill` afterwards populates the new jsonb column in
      // batches, which is the scenario this seed script exists to exercise.
      await client.query(
        `INSERT INTO tenant_settings (tenant_id, theme, timezone, language, email_notifications)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (tenant_id) DO NOTHING`,
        [tenantId, "system", "UTC", "en", true],
      );
    }

    console.log(`Seeding ${BULK_COUNT} bulk tenants in batches of ${BATCH_SIZE} ...`);
    const startTime = Date.now();
    let inserted = 0;

    for (let offset = 0; offset < BULK_COUNT; offset += BATCH_SIZE) {
      const count = Math.min(BATCH_SIZE, BULK_COUNT - offset);

      await client.query("BEGIN");
      try {
        // Build one multi-row INSERT per table per batch (not per-row
        // round trips) for throughput, while keeping each transaction
        // short-lived (~1000 rows) to avoid long-running locks.
        const tenantValues: string[] = [];
        const tenantParams: unknown[] = [];
        for (let i = 0; i < count; i++) {
          const n = offset + i;
          const base = i * 3;
          tenantValues.push(`($${base + 1}, $${base + 2}, $${base + 3})`);
          tenantParams.push(`bulk-tenant-${n}`, `Bulk Tenant ${n}`, apiKey());
        }

        const tenantRows = await client.query<{ id: number; slug: string }>(
          `INSERT INTO tenants (slug, name, api_key)
           VALUES ${tenantValues.join(",")}
           ON CONFLICT (slug) DO NOTHING
           RETURNING id, slug`,
          tenantParams,
        );

        if (tenantRows.rows.length > 0) {
          // Bulk rows also start without notification_preferences so the
          // 100k+ dataset is representative of "data written before the
          // expand migration shipped" and can be used to time/verify the
          // batched backfill script realistically.
          const settingsValues: string[] = [];
          const settingsParams: unknown[] = [];
          tenantRows.rows.forEach((row, i) => {
            const n = Number(row.slug.replace("bulk-tenant-", ""));
            const base = i * 5;
            settingsValues.push(
              `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`,
            );
            settingsParams.push(row.id, pick(THEMES, n), pick(TIMEZONES, n), pick(LANGUAGES, n), n % 3 !== 0);
          });

          await client.query(
            `INSERT INTO tenant_settings (tenant_id, theme, timezone, language, email_notifications)
             VALUES ${settingsValues.join(",")}
             ON CONFLICT (tenant_id) DO NOTHING`,
            settingsParams,
          );
        }

        await client.query("COMMIT");
        inserted += count;
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      }

      if (offset % (BATCH_SIZE * 10) === 0) {
        console.log(`  ... ${inserted}/${BULK_COUNT} rows processed`);
      }
    }

    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`Bulk seeding complete: ${inserted} rows in ${elapsedSec}s`);

    const { rows: countRows } = await client.query<{ count: string }>(
      "SELECT count(*)::text AS count FROM tenant_settings",
    );
    console.log(`tenant_settings now has ${countRows[0].count} total rows`);

    console.log("\nDemo tenant credentials (for local UI testing only):");
    for (const tenant of DEMO_TENANTS) {
      console.log(`  slug=${tenant.slug}  api_key=${demoKeys[tenant.slug]}`);
    }

    // Write demo credentials to a gitignored local file so the dev-only
    // "/api/tenants/demo" endpoint (disabled in production) can surface
    // them in the UI for convenience. Never used for real tenant data.
    const outDir = join(process.cwd(), "seed-output");
    mkdirSync(outDir, { recursive: true });
    writeFileSync(
      join(outDir, "demo-tenants.json"),
      JSON.stringify(
        DEMO_TENANTS.map((t) => ({ slug: t.slug, name: t.name, apiKey: demoKeys[t.slug] })),
        null,
        2,
      ),
    );
    console.log(`\nWrote demo tenant credentials to seed-output/demo-tenants.json`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
