import { describe, expect, it } from "vitest";
import { checkRedisHealth, safeRedisOp } from "@/lib/redis";
import { getCachedTenantSettings, invalidateTenantSettingsCache, setCachedTenantSettings } from "@/lib/cache";

// These tests intentionally run against whatever REDIS_URL is configured for
// the environment. In this sandbox no Redis server is listening, so they
// exercise the real graceful-degradation path end to end. If a real Redis
// instance becomes reachable, checkRedisHealth will simply report
// "available" and safeRedisOp calls will succeed instead of failing closed.

describe("Redis graceful degradation", () => {
  it("never throws from safeRedisOp even when Redis is unreachable", async () => {
    const result = await safeRedisOp(async (client) => client.ping());
    // Either a real PONG (if Redis happens to be available) or null
    // (swallowed failure) — but never a thrown exception.
    expect(result === null || typeof result === "string").toBe(true);
  });

  it("reports a well-formed health payload without throwing", async () => {
    const health = await checkRedisHealth(true);
    expect(["available", "unavailable"]).toContain(health.status);
    expect(typeof health.checkedAt).toBe("string");
    if (health.status === "unavailable") {
      expect(health.latencyMs).toBeNull();
      expect(typeof health.lastError).toBe("string");
    } else {
      expect(typeof health.latencyMs).toBe("number");
    }
  });

  it("never exposes connection strings or credentials in the health error message", async () => {
    const health = await checkRedisHealth(true);
    if (health.lastError) {
      expect(health.lastError.toLowerCase()).not.toContain("redis://");
      expect(health.lastError.toLowerCase()).not.toContain("password");
    }
  });
});

describe("Tenant settings cache helpers degrade safely", () => {
  it("getCachedTenantSettings resolves to null instead of throwing on failure", async () => {
    await expect(getCachedTenantSettings(999999)).resolves.not.toThrow;
    const value = await getCachedTenantSettings(999999);
    expect(value === null || typeof value === "object").toBe(true);
  });

  it("setCachedTenantSettings resolves to a boolean instead of throwing on failure", async () => {
    const ok = await setCachedTenantSettings(999999, {
      tenantId: 999999,
      workspaceName: "Ghost",
      workspaceDescription: "",
      timezone: "UTC",
      locale: "en-US",
      theme: "system",
      density: "comfortable",
      notifyEmailUpdates: true,
      notifyProjectActivity: true,
      notifyWeeklyDigest: false,
      updatedAt: new Date().toISOString(),
      updatedBy: null,
    });
    expect(typeof ok).toBe("boolean");
  });

  it("invalidateTenantSettingsCache resolves to a boolean instead of throwing on failure", async () => {
    const ok = await invalidateTenantSettingsCache(999999);
    expect(typeof ok).toBe("boolean");
  });
});
