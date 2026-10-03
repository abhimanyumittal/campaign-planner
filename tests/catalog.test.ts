import { describe, expect, test } from "vitest";
import { PUBLISHERS, PERSONAS } from "@/lib/catalog";
import { CATEGORIES, VALUES } from "@/lib/taxonomy";

describe("catalog tagging", () => {
  test("every publisher has a profile with valid tags", () => {
    expect(PUBLISHERS).toHaveLength(20);
    for (const p of PUBLISHERS) {
      expect(p.profile.categories.length).toBeGreaterThan(0);
      p.profile.categories.forEach((c) => expect(CATEGORIES).toContain(c));
      p.profile.values.forEach((v) => expect(VALUES).toContain(v));
    }
  });

  test("every persona has a profile with valid tags", () => {
    expect(PERSONAS).toHaveLength(10);
    for (const p of PERSONAS) {
      expect(p.profile.categories.length).toBeGreaterThan(0);
      [...p.profile.values, ...p.profile.antiValues].forEach((v) => expect(VALUES).toContain(v));
    }
  });

  test("some categories intentionally have no publisher (so we can say so)", () => {
    const carried = new Set(PUBLISHERS.flatMap((p) => p.profile.categories));
    expect(carried.has("outdoor_gear")).toBe(false);
    expect(carried.has("luxury_accessories")).toBe(false);
    expect(carried.has("b2b_software")).toBe(false);
  });
});
