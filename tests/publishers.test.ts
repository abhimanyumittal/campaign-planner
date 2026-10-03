import { describe, expect, test } from "vitest";
import { scorePersonas } from "@/lib/scoring/personas";
import { decideInclusion, MAX_INCLUDED, scorePublishers } from "@/lib/scoring/publishers";
import { computeFlags } from "@/lib/scoring/flags";
import { ACTIVEWEAR, CANDLES, CLEANING, DENTAL, DOG_FOOD, HANDBAG } from "./fixtures";
import type { Brief } from "@/lib/types";

const run = (b: Brief) => scorePublishers(b, scorePersonas(b));
const includedIds = (b: Brief) => run(b).filter((m) => m.included).map((m) => m.publisher.id);

describe("scorePublishers", () => {
  test("dog food → Pawline and Ruffco are the top two", () => {
    expect(includedIds(DOG_FOOD).slice(0, 2).sort()).toEqual(["pub_007", "pub_009"]);
  });

  test("dog food → beauty publisher excluded with a reason", () => {
    const velvet = run(DOG_FOOD).find((m) => m.publisher.id === "pub_013")!;
    expect(velvet.included).toBe(false);
    expect(velvet.exclusionReason).toBeTruthy();
  });

  test("$1,200 handbag → nothing clears the bar, price is the stated reason", () => {
    const res = run(HANDBAG);
    expect(res.filter((m) => m.included)).toHaveLength(0);
    const linden = res.find((m) => m.publisher.id === "pub_005")!;
    expect(linden.exclusionReason).toMatch(/price/i);
    expect(computeFlags(HANDBAG, res).map((f) => f.code)).toContain("price_above_catalog");
  });

  test("no_fit → nothing included, explained", () => {
    const res = run(DENTAL);
    expect(res.filter((m) => m.included)).toHaveLength(0);
    expect(res[0].exclusionReason).toMatch(/outside/i);
    expect(computeFlags(DENTAL, res).map((f) => f.code)).toEqual(expect.arrayContaining(["no_fit", "no_category_coverage"]));
  });

  test("candles → Northbed included via direct category and gifting personas", () => {
    const northbed = run(CANDLES).find((m) => m.publisher.id === "pub_011")!;
    expect(northbed.included).toBe(true);
    expect(northbed.viaPersonas.length).toBeGreaterThan(0);
  });

  test("refillable cleaning → Pantrygood included", () => {
    expect(includedIds(CLEANING)).toContain("pub_008");
  });

  test("activewear → a broad 'womens apparel' match alone doesn't qualify classic-apparel stores", () => {
    const ids = includedIds(ACTIVEWEAR);
    expect(ids[0]).toBe("pub_002");
    expect(ids).not.toContain("pub_005");
    expect(ids).not.toContain("pub_004");
  });

  test("candles → apparel and beauty stores don't qualify through broad-category links alone", () => {
    const ids = includedIds({ ...CANDLES, values: ["sustainability", "premium_quality", "giftable", "heritage_craft"], priceTier: "premium" });
    expect(ids).not.toContain("pub_002");
    expect(ids).not.toContain("pub_013");
  });

  test("decideInclusion caps the list", () => {
    const res = run(DOG_FOOD).map((m) => ({ ...m, finalScore: 90, directCategory: true }));
    expect(decideInclusion(DOG_FOOD, res).filter((m) => m.included)).toHaveLength(MAX_INCLUDED);
  });
});
