import { describe, expect, it } from "vitest";
import { loginSchema, projectCreateSchema, signupSchema, tenantSettingsSchema } from "@/lib/validation";

describe("signupSchema", () => {
  it("accepts a valid signup payload", () => {
    const result = signupSchema.safeParse({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "supersecret123",
      workspaceName: "Analytical Engines",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a short password", () => {
    const result = signupSchema.safeParse({
      name: "Ada",
      email: "ada@example.com",
      password: "short",
      workspaceName: "Engines",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = signupSchema.safeParse({
      name: "Ada",
      email: "not-an-email",
      password: "supersecret123",
      workspaceName: "Engines",
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("requires a non-empty password", () => {
    const result = loginSchema.safeParse({ email: "a@b.com", password: "" });
    expect(result.success).toBe(false);
  });
});

describe("tenantSettingsSchema", () => {
  const base = {
    workspaceName: "Acme",
    workspaceDescription: "A workspace",
    timezone: "UTC",
    locale: "en-US" as const,
    theme: "system" as const,
    density: "comfortable" as const,
    notifyEmailUpdates: true,
    notifyProjectActivity: true,
    notifyWeeklyDigest: false,
  };

  it("accepts a fully valid payload", () => {
    expect(tenantSettingsSchema.safeParse(base).success).toBe(true);
  });

  it("rejects an unsupported locale", () => {
    const result = tenantSettingsSchema.safeParse({ ...base, locale: "xx-XX" });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown time zone", () => {
    const result = tenantSettingsSchema.safeParse({ ...base, timezone: "Not/AZone" });
    expect(result.success).toBe(false);
  });

  it("rejects a workspace name that is too short", () => {
    const result = tenantSettingsSchema.safeParse({ ...base, workspaceName: "A" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid theme value", () => {
    const result = tenantSettingsSchema.safeParse({ ...base, theme: "neon" });
    expect(result.success).toBe(false);
  });
});

describe("projectCreateSchema", () => {
  it("defaults status to active", () => {
    const result = projectCreateSchema.safeParse({ name: "Launch plan" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("active");
    }
  });
});
