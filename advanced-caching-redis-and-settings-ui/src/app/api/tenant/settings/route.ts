import { getCurrentAuth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/api-response";
import { getTenantSettings, updateTenantSettings } from "@/lib/tenant-settings";
import { tenantSettingsSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await getCurrentAuth();
  if (!auth) {
    return apiError("Not authenticated", 401);
  }

  try {
    // Tenant id always comes from the authenticated session, never from the
    // client request, so a tenant can never read another tenant's settings.
    const { settings, source } = await getTenantSettings(auth.tenant.id);
    return apiOk({ settings, source });
  } catch (err) {
    console.error("[settings] failed to load tenant settings", err instanceof Error ? err.message : err);
    return apiError("Unable to load tenant settings right now", 500);
  }
}

export async function PUT(request: Request) {
  const auth = await getCurrentAuth();
  if (!auth) {
    return apiError("Not authenticated", 401);
  }

  if (auth.role === "member") {
    return apiError("You do not have permission to change workspace settings", 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Request body must be valid JSON", 400);
  }

  const parsed = tenantSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Validation failed", 422, parsed.error.flatten().fieldErrors);
  }

  try {
    const { settings, cacheInvalidated } = await updateTenantSettings(auth.tenant.id, auth.user.id, parsed.data);
    return apiOk({ settings, cacheInvalidated });
  } catch (err) {
    console.error("[settings] failed to update tenant settings", err instanceof Error ? err.message : err);
    return apiError("Unable to save settings right now. Please try again.", 500);
  }
}
