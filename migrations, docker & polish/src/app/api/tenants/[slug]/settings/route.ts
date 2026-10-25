import {
  authenticateTenant,
  getTenantSettings,
  updateTenantSettings,
} from "@/lib/settings";
import { settingsUpdateSchema, tenantAuthSchema } from "@/lib/validation";
import { ZodError } from "zod";

export const dynamic = "force-dynamic";

function unauthorized() {
  return Response.json(
    { error: "Invalid tenant slug or API key." },
    { status: 401 },
  );
}

function badRequest(message: string, details?: unknown) {
  return Response.json({ error: message, details }, { status: 400 });
}

async function resolveTenant(slug: string, request: Request) {
  const apiKey = request.headers.get("x-api-key") ?? "";
  const parsed = tenantAuthSchema.safeParse({ slug, apiKey });
  if (!parsed.success) {
    return { error: badRequest("Invalid tenant identifier.", parsed.error.flatten()) };
  }
  const tenant = await authenticateTenant(parsed.data.slug, parsed.data.apiKey);
  if (!tenant) return { error: unauthorized() };
  return { tenant };
}

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;

  try {
    const resolved = await resolveTenant(slug, request);
    if ("error" in resolved) return resolved.error;

    const result = await getTenantSettings(resolved.tenant.id);
    if (!result) {
      return Response.json({ error: "Settings not found for tenant." }, { status: 404 });
    }

    return Response.json({
      tenant: { slug: resolved.tenant.slug, name: resolved.tenant.name },
      settings: result.settings,
      cache: { source: result.source },
    });
  } catch (err) {
    console.error("GET /api/tenants/[slug]/settings failed:", err);
    return Response.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;

  try {
    const resolved = await resolveTenant(slug, request);
    if ("error" in resolved) return resolved.error;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequest("Request body must be valid JSON.");
    }

    const parsed = settingsUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Validation failed.", parsed.error.flatten());
    }

    const result = await updateTenantSettings(resolved.tenant.id, parsed.data);
    if (!result) {
      return Response.json({ error: "Settings not found for tenant." }, { status: 404 });
    }

    return Response.json({
      tenant: { slug: resolved.tenant.slug, name: resolved.tenant.name },
      settings: result.settings,
      cache: { source: result.source },
      message: "Settings saved successfully.",
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return badRequest("Validation failed.", err.flatten());
    }
    console.error("PATCH /api/tenants/[slug]/settings failed:", err);
    return Response.json({ error: "Internal server error." }, { status: 500 });
  }
}
