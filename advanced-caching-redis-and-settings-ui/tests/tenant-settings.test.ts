import { afterAll, beforeAll, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { eq } from "drizzle-orm";

// Mock the cache layer with an in-memory store so cache hit/miss/expiration/
// invalidation behavior can be asserted deterministically, independent of
// whether a real Redis instance is reachable in the current environment.
vi.mock("@/lib/cache", () => {
  const store = new Map<number, unknown>();
  return {
    __store: store,
    getCachedTenantSettings: vi.fn(async (tenantId: number) => {
      return store.has(tenantId) ? store.get(tenantId) : null;
    }),
    setCachedTenantSettings: vi.fn(async (tenantId: number, value: unknown) => {
      store.set(tenantId, value);
      return true;
    }),
    invalidateTenantSettingsCache: vi.fn(async (tenantId: number) => {
      store.delete(tenantId);
      return true;
    }),
  };
});

import { db } from "@/db";
import { memberships, tenants, tenantSettings, users } from "@/db/schema";
import * as cacheModule from "@/lib/cache";
import { getTenantSettings, updateTenantSettings } from "@/lib/tenant-settings";

const store = (cacheModule as unknown as { __store: Map<number, unknown> }).__store;

let tenantAId: number;
let tenantBId: number;
let userAId: number;

async function createTenant(name: string, slug: string) {
  const [tenant] = await db.insert(tenants).values({ name, slug }).returning();
  const [user] = await db
    .insert(users)
    .values({ name: `${name} Owner`, email: `${slug}-${Date.now()}@example.test`, passwordHash: "x" })
    .returning();
  await db.insert(memberships).values({ tenantId: tenant.id, userId: user.id, role: "owner" });
  await db.insert(tenantSettings).values({ tenantId: tenant.id, workspaceName: name, updatedBy: user.id });
  return { tenantId: tenant.id, userId: user.id };
}

beforeAll(async () => {
  const unique = Date.now();
  const a = await createTenant(`Test Tenant A ${unique}`, `test-tenant-a-${unique}`);
  const b = await createTenant(`Test Tenant B ${unique}`, `test-tenant-b-${unique}`);
  tenantAId = a.tenantId;
  userAId = a.userId;
  tenantBId = b.tenantId;
});

afterAll(async () => {
  for (const id of [tenantAId, tenantBId]) {
    if (id) await db.delete(tenants).where(eq(tenants.id, id));
  }
});

beforeEach(() => {
  store.clear();
  vi.clearAllMocks();
});

describe("getTenantSettings (cache-aside)", () => {
  it("reports a cache miss then populates the cache from the database", async () => {
    const result = await getTenantSettings(tenantAId);
    expect(result.source).toBe("database");
    expect(cacheModule.setCachedTenantSettings).toHaveBeenCalledTimes(1);
  });

  it("serves a cache hit on the next read without querying the database result again", async () => {
    await getTenantSettings(tenantAId); // populates cache
    const second = await getTenantSettings(tenantAId);
    expect(second.source).toBe("cache");
  });

  it("falls back to the database after the cache entry expires", async () => {
    await getTenantSettings(tenantAId);
    expect(store.has(tenantAId)).toBe(true);

    // Simulate TTL expiration by removing the entry, exactly as Redis would
    // after the configured TTL elapses.
    store.delete(tenantAId);

    const result = await getTenantSettings(tenantAId);
    expect(result.source).toBe("database");
  });
});

describe("tenant isolation", () => {
  it("never returns tenant B settings when requesting tenant A", async () => {
    const a = await getTenantSettings(tenantAId);
    const b = await getTenantSettings(tenantBId);
    expect(a.settings.tenantId).toBe(tenantAId);
    expect(b.settings.tenantId).toBe(tenantBId);
    expect(a.settings.workspaceName).not.toBe(b.settings.workspaceName);
  });

  it("stores cache entries under distinct tenant-scoped keys", async () => {
    await getTenantSettings(tenantAId);
    await getTenantSettings(tenantBId);
    expect(store.has(tenantAId)).toBe(true);
    expect(store.has(tenantBId)).toBe(true);
  });
});

describe("updateTenantSettings", () => {
  const validInput = {
    workspaceName: "Updated Workspace Name",
    workspaceDescription: "Updated description",
    timezone: "UTC",
    locale: "en-US" as const,
    theme: "dark" as const,
    density: "compact" as const,
    notifyEmailUpdates: false,
    notifyProjectActivity: true,
    notifyWeeklyDigest: true,
  };

  it("persists changes to the database and invalidates + repopulates the cache", async () => {
    await getTenantSettings(tenantAId); // warm the cache first
    const { settings, cacheInvalidated } = await updateTenantSettings(tenantAId, userAId, validInput);

    expect(settings.workspaceName).toBe("Updated Workspace Name");
    expect(cacheInvalidated).toBe(true);
    expect(cacheModule.invalidateTenantSettingsCache).toHaveBeenCalledWith(tenantAId);

    // Subsequent read should hit the freshly-populated cache with the new value.
    const after = await getTenantSettings(tenantAId);
    expect(after.source).toBe("cache");
    expect(after.settings.workspaceName).toBe("Updated Workspace Name");
  });

  it("does not report the database update as failed when cache invalidation fails", async () => {
    (cacheModule.invalidateTenantSettingsCache as Mock).mockImplementationOnce(async () => {
      throw new Error("simulated redis invalidation failure");
    });

    const result = await updateTenantSettings(tenantAId, userAId, validInput);

    // The database write must still be reported as successful even though
    // the cache layer threw. cacheInvalidated reflects the degraded cache
    // outcome without failing the overall operation.
    expect(result.settings.workspaceName).toBe("Updated Workspace Name");
    expect(result.cacheInvalidated).toBe(false);
  });

  it("keeps tenant B settings untouched when tenant A is updated", async () => {
    await updateTenantSettings(tenantAId, userAId, validInput);
    const b = await getTenantSettings(tenantBId);
    expect(b.settings.workspaceName).not.toBe("Updated Workspace Name");
  });
});
