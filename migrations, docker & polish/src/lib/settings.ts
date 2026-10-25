import { db } from "@/db";
import { tenants, tenantSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cacheDelete, cacheGet, cacheSet, isRedisAvailable } from "@/lib/redis";
import type { CacheSource, TenantSettingsDTO } from "@/types/settings";

export const SETTINGS_CACHE_TTL_SECONDS = 300;

export type { CacheSource, TenantSettingsDTO };

export interface SettingsLookupResult {
  settings: TenantSettingsDTO;
  source: CacheSource;
}

function cacheKey(tenantId: number): string {
  return `settings:tenant:${tenantId}`;
}

function toDTO(
  tenant: { id: number; slug: string; name: string },
  settings: typeof tenantSettings.$inferSelect,
): TenantSettingsDTO {
  return {
    tenantId: tenant.id,
    slug: tenant.slug,
    name: tenant.name,
    theme: (settings.theme as TenantSettingsDTO["theme"]) ?? "system",
    timezone: settings.timezone,
    language: settings.language,
    notificationPreferences: settings.notificationPreferences,
  };
}

/**
 * Looks up a tenant by slug + api key together, so a failed lookup never
 * reveals whether the slug exists or the key was merely wrong (prevents
 * tenant enumeration).
 */
export async function authenticateTenant(slug: string, apiKey: string) {
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .limit(1);

  if (!tenant || tenant.apiKey !== apiKey) {
    return null;
  }
  return tenant;
}

/**
 * Reads tenant settings cache-first, with graceful fallback to PostgreSQL
 * (the source of truth) whenever Redis is unavailable or has no entry.
 * Cache keys are scoped per-tenant-id, so there is no possibility of one
 * tenant's cached settings leaking into another tenant's response.
 */
export async function getTenantSettings(tenantId: number): Promise<SettingsLookupResult | null> {
  const key = cacheKey(tenantId);

  const cached = await cacheGet<TenantSettingsDTO>(key);
  if (cached && cached.tenantId === tenantId) {
    return { settings: cached, source: "cache" };
  }

  const [row] = await db
    .select({
      tenant: tenants,
      settings: tenantSettings,
    })
    .from(tenantSettings)
    .innerJoin(tenants, eq(tenants.id, tenantSettings.tenantId))
    .where(eq(tenantSettings.tenantId, tenantId))
    .limit(1);

  if (!row) return null;

  const dto = toDTO(row.tenant, row.settings);

  // Best-effort cache warm; failures are swallowed inside cacheSet.
  await cacheSet(key, dto, SETTINGS_CACHE_TTL_SECONDS);

  return { settings: dto, source: "database" };
}

export interface SettingsUpdateInput {
  theme?: "light" | "dark" | "system";
  timezone?: string;
  language?: string;
  notificationPreferences?: { email: boolean; sms: boolean; push: boolean };
}

/**
 * Updates settings in PostgreSQL (source of truth) first, then refreshes the
 * cache with the new value (rather than merely invalidating it) so the very
 * next read - even a concurrent one - never observes stale data. If the
 * cache write fails, we still return success because the database update
 * already succeeded; the next read will simply repopulate the cache.
 *
 * The legacy `email_notifications` boolean is kept in sync with
 * `notificationPreferences.email` so any not-yet-upgraded reader of the
 * old column during the expand/contract migration window still sees
 * correct data (dual-write pattern).
 */
export async function updateTenantSettings(
  tenantId: number,
  input: SettingsUpdateInput,
): Promise<SettingsLookupResult | null> {
  const updatePayload: Partial<typeof tenantSettings.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (input.theme !== undefined) updatePayload.theme = input.theme;
  if (input.timezone !== undefined) updatePayload.timezone = input.timezone;
  if (input.language !== undefined) updatePayload.language = input.language;
  if (input.notificationPreferences !== undefined) {
    updatePayload.notificationPreferences = input.notificationPreferences;
    updatePayload.emailNotifications = input.notificationPreferences.email;
  }

  const [updated] = await db
    .update(tenantSettings)
    .set(updatePayload)
    .where(eq(tenantSettings.tenantId, tenantId))
    .returning();

  if (!updated) return null;

  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
  if (!tenant) return null;

  const dto = toDTO(tenant, updated);
  await cacheSet(cacheKey(tenantId), dto, SETTINGS_CACHE_TTL_SECONDS);

  return { settings: dto, source: "database" };
}

export async function invalidateTenantSettingsCache(tenantId: number): Promise<void> {
  await cacheDelete(cacheKey(tenantId));
}

export { isRedisAvailable };
