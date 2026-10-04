import { describe, expect, test } from "vitest";
import { fillPersonas, MIN_PERSONAS, scorePersonas } from "@/lib/scoring/personas";
import { scorePublishers } from "@/lib/scoring/publishers";
import type { Brief } from "@/lib/types";
import { DENTAL, FOR_MOMS, NA_DRINK, makeBrief } from "./fixtures";

function plan(brief: Brief) {
  const personas = scorePersonas(brief);
  const publishers = scorePublishers(brief, personas);
  return { before: personas, after: fillPersonas(brief, personas, publishers), publishers };
}

describe("fillPersonas", () => {
  test("tops up to 3 when only 2 personas qualify, and labels the fill-in", () => {
    const { before, after } = plan(NA_DRINK);
    expect(before.filter((m) => m.selected)).toHaveLength(2);
    const selected = after.filter((m) => m.selected);
    expect(selected).toHaveLength(MIN_PERSONAS);
    const filler = selected.find((m) => m.fillReason)!;
    expect(filler.fillReason).toMatch(/3 ads/);
  });

  test("prefers personas who shop where the ads will run (closest publishers when none qualify)", () => {
    const { after, publishers } = plan(FOR_MOMS);
    expect(publishers.some((m) => m.included)).toBe(false);
    const closest = [...publishers].sort((a, b) => b.score - a.score).slice(0, 3);
    const carried = new Set(closest.flatMap((m) => m.publisher.profile.categories));
    const filler = after.find((m) => m.fillReason)!;
    expect(filler.persona.profile.categories.some((c) => carried.has(c))).toBe(true);
    expect(filler.fillReason).toMatch(/shops at/i);
  });

  test("looks at near-miss publishers before falling back to raw score", () => {
    // "We help people feel better": only the two wellness personas shop at the recommended publishers.
    const feelBetter = makeBrief({ status: "vague", categories: ["supplements_vitamins", "spa_selfcare"], values: ["health_conscious"] });
    const filler = plan(feelBetter).after.find((m) => m.fillReason)!;
    expect(filler.persona.id).not.toBe("persona_004"); // not the Pet Parent
    expect(filler.fillReason).toMatch(/shops at/i);
  });

  test("never fills with a persona the pitch actively turns off", () => {
    const brief = makeBrief({ categories: ["pet_food"], values: ["value_price"], priceTier: "budget" });
    const { after } = plan(brief);
    const petParent = after.find((m) => m.persona.id === "persona_004")!;
    expect(petParent.fillReason).toBeNull();
  });

  test("does not fill for out-of-scope or zero-signal input", () => {
    expect(plan(DENTAL).after.some((m) => m.selected)).toBe(false);
    expect(plan(makeBrief({ status: "vague", categories: [] })).after.some((m) => m.selected)).toBe(false);
  });

  test("does not mutate its input", () => {
    const personas = scorePersonas(NA_DRINK);
    const before = JSON.stringify(personas);
    fillPersonas(NA_DRINK, personas, []);
    expect(JSON.stringify(personas)).toBe(before);
  });
});
