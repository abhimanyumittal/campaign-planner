import { describe, expect, test } from "vitest";
import { scorePersonas } from "@/lib/scoring/personas";
import { ACTIVEWEAR, DENTAL, DOG_FOOD, HANDBAG } from "./fixtures";

describe("scorePersonas", () => {
  test("dog food → Pet Parent ranks first, 3–5 selected", () => {
    const res = scorePersonas(DOG_FOOD);
    expect(res[0].persona.id).toBe("persona_004");
    const selected = res.filter((m) => m.selected);
    expect(selected.length).toBeGreaterThanOrEqual(3);
    expect(selected.length).toBeLessThanOrEqual(5);
    expect(res[0].reasons.some((r) => r.label.includes("pet food"))).toBe(true);
  });

  test("Gifter is penalised for subscription products", () => {
    const gifter = scorePersonas(DOG_FOOD).find((m) => m.persona.id === "persona_010")!;
    expect(gifter.reasons.some((r) => r.label === "Avoids subscription-only offers")).toBe(true);
  });

  test("luxury handbag → Affluent Classic and Gifter selected", () => {
    const ids = scorePersonas(HANDBAG).filter((m) => m.selected).map((m) => m.persona.id);
    expect(ids).toContain("persona_005");
    expect(ids).toContain("persona_010");
  });

  test("a broad-only category match can't make a persona a strong pick", () => {
    const affluent = scorePersonas({ ...ACTIVEWEAR, values: ["sustainability", "premium_quality"] }).find((m) => m.persona.id === "persona_005")!;
    expect(affluent.score).toBeLessThan(40);
  });

  test("no_fit → nobody selected", () => {
    expect(scorePersonas(DENTAL).some((m) => m.selected)).toBe(false);
  });
});
