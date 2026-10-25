/**
 * Batched backfill for the expand/contract migration.
 *
 * After 0001_expand_notification_preferences.sql adds the nullable
 * `notification_preferences` jsonb column, existing rows have NULL there.
 * This script populates it from the legacy `email_notifications` boolean in
 * small batches (default 5,000 rows) using the primary key as a cursor, so:
 *
 *   - No single UPDATE touches the whole table / holds a long transaction.
 *   - Each batch commits independently, so progress is never lost and other
 *     writers are only blocked for the duration of one small batch.
 *   - The script is idempotent and resumable: it only looks at rows where
 *     notification_preferences IS NULL, so re-running it after a crash just
 *     continues where it left off.
 *
 * Run this AFTER applying the expand migration and BEFORE applying the
 * contract migration (which adds the NOT NULL constraint).
 *
 * Usage:
 *   npm run db:backfill
 *   BACKFILL_BATCH_SIZE=10000 BACKFILL_SLEEP_MS=50 npm run db:backfill
 */
import "dotenv/config";
import { Pool } from "pg";

const BATCH_SIZE = Number(process.env.BACKFILL_BATCH_SIZE ?? 5000);
const SLEEP_MS = Number(process.env.BACKFILL_SLEEP_MS ?? 25);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required");

  const pool = new Pool({ connectionString: databaseUrl, max: 2 });

  const { rows: pendingRows } = await pool.query<{ count: string }>(
    "SELECT count(*)::text AS count FROM tenant_settings WHERE notification_preferences IS NULL",
  );
  const totalPending = Number(pendingRows[0].count);
  console.log(`Backfilling notification_preferences for ${totalPending} row(s) in batches of ${BATCH_SIZE} ...`);

  let totalUpdated = 0;
  const start = Date.now();

  for (;;) {
    // Each batch is its own short transaction/statement - never a single
    // table-wide lock.
    const result = await pool.query(
      `WITH batch AS (
         SELECT id FROM tenant_settings
         WHERE notification_preferences IS NULL
         ORDER BY id
         LIMIT $1
         FOR UPDATE SKIP LOCKED
       )
       UPDATE tenant_settings t
       SET notification_preferences = jsonb_build_object(
             'email', t.email_notifications,
             'sms', false,
             'push', true
           ),
           updated_at = now()
       FROM batch
       WHERE t.id = batch.id`,
      [BATCH_SIZE],
    );

    const updated = result.rowCount ?? 0;
    totalUpdated += updated;

    if (updated === 0) break;

    console.log(`  ... backfilled ${totalUpdated}/${totalPending}`);

    // Small pause between batches to let other queries interleave freely
    // on a busy production database.
    await sleep(SLEEP_MS);
  }

  const elapsedSec = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`Backfill complete: ${totalUpdated} row(s) updated in ${elapsedSec}s`);

  const { rows: remaining } = await pool.query<{ count: string }>(
    "SELECT count(*)::text AS count FROM tenant_settings WHERE notification_preferences IS NULL",
  );
  console.log(`Remaining NULL rows: ${remaining[0].count}`);

  await pool.end();
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
