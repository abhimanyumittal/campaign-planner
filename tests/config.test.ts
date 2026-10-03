import { describe, expect, test } from "vitest";
import { allocateBudget, buildCampaignConfig, MIN_ALLOCATION_USD } from "@/lib/config";
import { publisherById } from "@/lib/catalog";
import type { PublisherMatch } from "@/lib/types";
import { DOG_FOOD, makeBrief } from "./fixtures";

function match(id: string, finalScore: number, included = true): PublisherMatch {
  return {
    publisher: publisherById(id)!, score: finalScore, reasons: [], directCategory: true, viaPersonas: [],
    adjustment: 0, finalScore, rationale: null, concern: null, included, exclusionReason: null,
  };
}

describe("allocateBudget", () => {
  test("splits the whole budget, higher score gets more", () => {
    const { allocations, unallocatedUsd } = allocateBudget([match("pub_007", 80), match("pub_009", 60)], 10_000);
    const total = allocations.reduce((s, a) => s + a.budgetUsd, 0);
    expect(Math.abs(total - 10_000)).toBeLessThanOrEqual(1);
    expect(unallocatedUsd).toBe(0);
    expect(allocations[0].budgetUsd).toBeGreaterThan(allocations[1].budgetUsd);
  });

  test("ignores excluded publishers", () => {
    const { allocations } = allocateBudget([match("pub_007", 80), match("pub_013", 90, false)], 10_000);
    expect(allocations.map((a) => a.publisherId)).toEqual(["pub_007"]);
  });

  test("drops publishers whose share is below the minimum", () => {
    const { allocations } = allocateBudget([match("pub_007", 100), match("pub_009", 10)], 1_000);
    expect(allocations.every((a) => a.budgetUsd >= MIN_ALLOCATION_USD)).toBe(true);
  });

  test("caps at 25% of monthly inventory and reports the leftover", () => {
    const { allocations, unallocatedUsd } = allocateBudget([match("pub_007", 80), match("pub_009", 60)], 1_000_000);
    expect(allocations.every((a) => a.capped)).toBe(true);
    expect(allocations.every((a) => a.pctOfMonthlyInventory <= 25.01)).toBe(true);
    expect(unallocatedUsd).toBeGreaterThan(0);
  });
});

describe("buildCampaignConfig", () => {
  const base = { publishers: [match("pub_007", 80), match("pub_009", 60)], personas: [], variants: [], budgetUsd: 10_000, budgetWasDefault: true };

  test("subscription → target CPA ≈ one order value", () => {
    const cfg = buildCampaignConfig({ ...base, brief: DOG_FOOD })!;
    expect(cfg.bidding.optimizedPhase.targetCpaUsd).toBe(70);
    expect(cfg.objective).toBe("conversions");
    expect(cfg.assumptions.some((a) => a.includes("No budget given"))).toBe(true);
  });

  test("one-time → target CPA = 30% of order value", () => {
    const cfg = buildCampaignConfig({ ...base, brief: makeBrief({ estPriceUsd: 100, purchaseModel: "one_time" }) })!;
    expect(cfg.bidding.optimizedPhase.targetCpaUsd).toBe(30);
  });

  test("vague brief → traffic objective", () => {
    expect(buildCampaignConfig({ ...base, brief: makeBrief({ status: "vague" }) })!.objective).toBe("traffic");
  });

  test("no included publishers → null", () => {
    expect(buildCampaignConfig({ ...base, brief: DOG_FOOD, publishers: [] })).toBeNull();
  });
});
