import type { Brief, FlagCode } from "@/lib/types";

export type Expectation = {
  status?: Brief["status"][];
  topIncludesAny?: string[];
  topN?: number;
  excludes?: string[];
  maxIncluded?: number;
  minIncluded?: number;
  personasIncludeAny?: string[];
  flagsIncludeAny?: FlagCode[];
  minQuestions?: number;
};

// Keyed by example number in data/example_advertisers.txt.
// Deliberately loose: "a sensible answer", not "the one right answer".
export const CASES: Record<number, Expectation> = {
  1: { status: ["clear"], topIncludesAny: ["pub_007", "pub_009"], topN: 2, excludes: ["pub_013", "pub_004", "pub_005"], personasIncludeAny: ["persona_004"] },
  2: { status: ["clear"], topIncludesAny: ["pub_002"], topN: 2, excludes: ["pub_005"] },
  3: { status: ["clear"], topIncludesAny: ["pub_020"], topN: 2 },
  4: { status: ["clear"], topIncludesAny: ["pub_011", "pub_014", "pub_010"], personasIncludeAny: ["persona_010"], excludes: ["pub_002"] }, // Velvetline is fine: it is where Gen Z candle buyers shop
  5: { status: ["vague"], minQuestions: 1, minIncluded: 1 }, // vague still gets a best guess
  6: { flagsIncludeAny: ["price_above_catalog", "no_category_coverage", "few_matches"], excludes: ["pub_005", "pub_013"] },
  7: { status: ["no_fit"], maxIncluded: 0 },
  8: { status: ["vague"], minQuestions: 1, minIncluded: 1 },
  9: { status: ["clear"], topIncludesAny: ["pub_008"], topN: 2, personasIncludeAny: ["persona_006"] },
  10: { flagsIncludeAny: ["price_above_catalog"], excludes: ["pub_001", "pub_013"] },
  11: { topIncludesAny: ["pub_012", "pub_002", "pub_020", "pub_003"] },
  12: { status: ["clear"], topIncludesAny: ["pub_018", "pub_007", "pub_009"], topN: 2 },
  13: { topIncludesAny: ["pub_002", "pub_012", "pub_017"], personasIncludeAny: ["persona_009", "persona_008"] },
  14: { status: ["clear"], topIncludesAny: ["pub_011"], topN: 1 },
  15: { status: ["vague"], minQuestions: 1 },
};
