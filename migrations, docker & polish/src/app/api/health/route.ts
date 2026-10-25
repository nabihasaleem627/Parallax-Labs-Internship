import { db } from "@/db";
import { sql } from "drizzle-orm";

/**
 * Legacy combined health endpoint, kept for backward compatibility with any
 * existing monitoring already pointed at /api/health. New integrations
 * should prefer the more precise /api/health/live and /api/health/ready
 * endpoints.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true }, { status: 200 });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
