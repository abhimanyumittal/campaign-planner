import { describe, expect, test } from "vitest";
import { applyReview, validateCreatives } from "@/lib/postprocess";
import { scorePersonas } from "@/lib/scoring/personas";
import { scorePublishers } from "@/lib/scoring/publishers";
import { DOG_FOOD } from "./fixtures";

const personas = scorePersonas(DOG_FOOD);
const pubs = scorePublishers(DOG_FOOD, personas);
const selected = personas.filter((m) => m.selected);

describe("applyReview", () => {
  test("clamps adjustments to ±15 and records rationale", () => {
    const { publishers } = applyReview(DOG_FOOD, pubs, {
      overallNote: "",
      publishers: [{ publisherId: "pub_007", adjustment: 50, rationale: "Great fit", concern: "" }],
    });
    const pawline = publishers.find((m) => m.publisher.id === "pub_007")!;
    expect(pawline.adjustment).toBe(15);
    expect(pawline.rationale).toBe("Great fit");
  });

  test("ignores unknown publishers with a warning", () => {
    const { warnings } = applyReview(DOG_FOOD, pubs, {
      overallNote: "", publishers: [{ publisherId: "pub_999", adjustment: 5, rationale: "", concern: "" }],
    });
    expect(warnings[0]).toMatch(/pub_999/);
  });

  test("a boost cannot include a publisher with no category or audience link", () => {
    const unrelated = pubs.find((m) => !m.directCategory && m.viaPersonas.length === 0)!;
    const { publishers } = applyReview(DOG_FOOD, pubs, {
      overallNote: "", publishers: [{ publisherId: unrelated.publisher.id, adjustment: 15, rationale: "", concern: "" }],
    });
    expect(publishers.find((m) => m.publisher.id === unrelated.publisher.id)!.included).toBe(false);
  });

  test("does not mutate its input", () => {
    const before = JSON.stringify(pubs);
    applyReview(DOG_FOOD, pubs, { overallNote: "", publishers: [{ publisherId: "pub_007", adjustment: -15, rationale: "", concern: "x" }] });
    expect(JSON.stringify(pubs)).toBe(before);
  });
});

describe("validateCreatives", () => {
  const ad = (personaId: string, extra: Partial<{ headline: string; bestPublisherId: string }> = {}) => ({
    personaId, whyThisPersona: "w", angle: "a", headline: "Short", body: "Body", cta: "Shop now", bestPublisherId: "pub_007", ...extra,
  });

  test("drops unknown and duplicate personas, nulls unknown publishers, warns on long headlines", () => {
    const ids = new Set(pubs.map((m) => m.publisher.id));
    const { variants, warnings } = validateCreatives(
      [ad(selected[0].persona.id), ad(selected[0].persona.id), ad("persona_999"), ad(selected[1].persona.id, { headline: "x".repeat(60), bestPublisherId: "pub_999" })],
      selected, ids,
    );
    expect(variants).toHaveLength(2);
    expect(variants[1].bestPublisherId).toBeNull();
    expect(variants.map((v) => v.id)).toEqual(["v1", "v2"]);
    expect(warnings.join(" ")).toMatch(/persona_999/);
    expect(warnings.join(" ")).toMatch(/duplicate/);
    expect(warnings.join(" ")).toMatch(/Headline/);
  });
});
