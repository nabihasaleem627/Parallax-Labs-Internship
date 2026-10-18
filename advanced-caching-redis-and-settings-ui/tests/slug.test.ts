import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/slug";

describe("slugify", () => {
  it("lowercases and dashes spaces", () => {
    expect(slugify("Acme Corp")).toBe("acme-corp");
  });

  it("strips special characters", () => {
    expect(slugify("Hello, World!!")).toBe("hello-world");
  });

  it("falls back to a default when empty", () => {
    expect(slugify("   ")).toBe("workspace");
  });
});
