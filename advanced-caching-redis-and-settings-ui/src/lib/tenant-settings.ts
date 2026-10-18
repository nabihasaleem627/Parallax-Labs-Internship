import { db } from "@/db";
import { activityLog, tenantSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCachedTenantSettings, invalidateTenantSettingsCache, setCachedTenantSettings } from "@/lib/cache";
import type { TenantSettingsDTO, TenantSettingsResult } from "@/lib/tenant-settings-types";
import type { TenantSettingsInput } from "@/lib/validation";

type TenantSettingsRow = typeof tenantSettings.$inferSelect;

function toDTO(row: TenantSettingsRow): TenantSettingsDTO {
  return {
    tenantId: row.tenantId,
    workspaceName: row.workspaceName,
    workspaceDescription: row.workspaceDescription,
    timezone: row.timezone,
    locale: row.locale,
    theme: row.theme,
    density: row.density,
    notifyEmailUpdates: row.notifyEmailUpdates,
    notifyProjectActivity: row.notifyProjectActivity,
    notifyWeeklyDigest: row.notifyWeeklyDigest,
    updatedAt: row.updatedAt.toISOString(),
    updatedBy: row.updatedBy,
  };
}

async function readFromDatabase(tenantId: number): Promise<TenantSettingsDTO | null> {
  const [row] = await db.select().from(tenantSettings).where(eq(tenantSettings.tenantId, tenantId)).limit(1);
  return row ? toDTO(row) : null;
}

/**
 * Reads tenant settings following the cache-aside pattern:
 * Redis (if available) -> PostgreSQL (authoritative) -> populate Redis.
 * The database is always treated as the source of truth; Redis is purely
 * a performance optimization and any failure there is swallowed.
 */
export async function getTenantSettings(tenantId: number): Promise<TenantSettingsResult> {
  const cached = await getCachedTenantSettings(tenantId);
  if (cached && cached.tenantId === tenantId) {
    return { settings: cached, source: "cache" };
  }

  const fromDb = await readFromDatabase(tenantId);
  if (!fromDb) {
    throw new Error("Tenant settings not found");
  }

  // Best-effort warm of the cache. Failure here must never affect the
  // response returned to the caller.
  await setCachedTenantSettings(tenantId, fromDb);

  return { settings: fromDb, source: "database" };
}

export async function updateTenantSettings(
  tenantId: number,
  userId: number,
  input: TenantSettingsInput,
): Promise<{ settings: TenantSettingsDTO; cacheInvalidated: boolean }> {
  const [updated] = await db
    .update(tenantSettings)
    .set({
      workspaceName: input.workspaceName,
      workspaceDescription: input.workspaceDescription,
      timezone: input.timezone,
      locale: input.locale,
      theme: input.theme,
      density: input.density,
      notifyEmailUpdates: input.notifyEmailUpdates,
      notifyProjectActivity: input.notifyProjectActivity,
      notifyWeeklyDigest: input.notifyWeeklyDigest,
      updatedAt: new Date(),
      updatedBy: userId,
    })
    .where(eq(tenantSettings.tenantId, tenantId))
    .returning();

  if (!updated) {
    throw new Error("Tenant settings not found");
  }

  const dto = toDTO(updated);

  // The database write already succeeded at this point. Cache invalidation
  // failures must be logged but must NOT cause the update to be reported as
  // failed to the client. safeRedisOp already swallows Redis errors, but we
  // defensively guard here too so a defect in the cache layer can never
  // surface as a false "save failed" error after a successful DB write.
  let cacheInvalidated = false;
  try {
    cacheInvalidated = await invalidateTenantSettingsCache(tenantId);
    // Repopulate immediately so subsequent reads hit a fresh cache entry
    // instead of forcing another database round trip. Best-effort only.
    await setCachedTenantSettings(tenantId, dto);
  } catch (err) {
    console.error("[cache] invalidation/repopulation failed after a successful DB update:", err instanceof Error ? err.message : err);
    cacheInvalidated = false;
  }

  await db.insert(activityLog).values({
    tenantId,
    userId,
    action: "tenant_settings_updated",
    metadata: { workspaceName: dto.workspaceName },
  });

  return { settings: dto, cacheInvalidated };
}
