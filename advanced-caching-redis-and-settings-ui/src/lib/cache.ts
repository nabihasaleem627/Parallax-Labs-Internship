import { safeRedisOp } from "@/lib/redis";
import type { TenantSettingsDTO } from "@/lib/tenant-settings-types";

// Tenant-scoped cache keys. Every key is namespaced by tenant id so that a
// cache lookup or invalidation can never leak across tenants.
export const SETTINGS_TTL_SECONDS = 300; // 5 minutes

function settingsKey(tenantId: number): string {
  return `projecthive:tenant:${tenantId}:settings`;
}

export async function getCachedTenantSettings(tenantId: number): Promise<TenantSettingsDTO | null> {
  const raw = await safeRedisOp((client) => client.get(settingsKey(tenantId)));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TenantSettingsDTO;
  } catch {
    return null;
  }
}

export async function setCachedTenantSettings(tenantId: number, settings: TenantSettingsDTO): Promise<boolean> {
  const result = await safeRedisOp((client) =>
    client.set(settingsKey(tenantId), JSON.stringify(settings), "EX", SETTINGS_TTL_SECONDS),
  );
  return result !== null;
}

export async function invalidateTenantSettingsCache(tenantId: number): Promise<boolean> {
  const result = await safeRedisOp((client) => client.del(settingsKey(tenantId)));
  return result !== null;
}
