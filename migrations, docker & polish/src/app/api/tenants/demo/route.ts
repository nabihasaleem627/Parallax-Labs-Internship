import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Development convenience endpoint ONLY. Surfaces the seeded demo tenant
 * slugs + API keys (generated locally by `npm run db:seed`) so the Settings
 * UI can offer one-click "try a demo tenant" buttons without a human typing
 * secrets around. This never runs in production - it is hard-disabled
 * there so no credentials are ever exposed outside local development.
 */
export const dynamic = "force-dynamic";

interface DemoTenant {
  slug: string;
  name: string;
  apiKey: string;
}

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return Response.json({ error: "Not found." }, { status: 404 });
  }

  try {
    const filePath = join(process.cwd(), "seed-output", "demo-tenants.json");
    const raw = await readFile(filePath, "utf8");
    const demoTenants = JSON.parse(raw) as DemoTenant[];
    return Response.json({ demoTenants, note: "Development-only seeded demo data." });
  } catch {
    return Response.json({ demoTenants: [], note: "Run `npm run db:seed` to generate demo tenants." });
  }
}
