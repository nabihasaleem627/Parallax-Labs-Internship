/**
 * Applies all pending SQL migrations from ./drizzle using drizzle-orm's
 * migrator. Each migration file runs in its own transaction (drizzle-kit
 * default) so a failure never leaves the schema half-applied.
 *
 * Usage:
 *   npm run db:migrate
 */
import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool);

  console.log("Applying pending migrations from ./drizzle ...");
  const start = Date.now();
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log(`Migrations applied successfully in ${Date.now() - start}ms`);

  await pool.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
