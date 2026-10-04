import { z } from "zod";
import { CATEGORIES, VALUES } from "./taxonomy";
import type { Persona, Publisher } from "./catalog";

export const BriefSchema = z.object({
  status: z.enum(["clear", "vague", "no_fit"]),
  statusReason: z.string(),
  productSummary: z.string(),
  categories: z.array(z.enum(CATEGORIES)),
  values: z.array(z.enum(VALUES)),
  priceTier: z.enum(["budget", "mid", "premium", "luxury", "unknown"]),
  estPriceUsd: z.number().nullable(),
  targetGender: z.enum(["female", "male", "any"]),
  targetAgeMin: z.number().nullable(),
  targetAgeMax: z.number().nullable(),
  purchaseModel: z.enum(["subscription", "one_time", "b2b", "unknown"]),
  confidence: z.number(),
  assumptions: z.array(z.string()),
  clarifyingQuestions: z.array(z.string()),
});
export type Brief = z.infer<typeof BriefSchema>;

export type Reason = { label: string; points: number };

export type PersonaMatch = {
  persona: Persona;
  score: number;
  reasons: Reason[];
  selected: boolean;
  stretch: boolean; // weak but real match (score 20–39)
  fillReason: string | null; // set when added only so there are at least 3 ads
};

export type PublisherMatch = {
  publisher: Publisher;
  score: number; // rule score
  reasons: Reason[];
  directCategory: boolean;
  viaPersonas: string[]; // persona names that shop here
  adjustment: number; // LLM review, clamped
  finalScore: number;
  rationale: string | null;
  concern: string | null;
  included: boolean;
  exclusionReason: string | null;
};

export type FlagCode = "vague_input" | "no_fit" | "price_above_catalog" | "no_category_coverage" | "few_matches";
export type Flag = { code: FlagCode; message: string };

export const ReviewSchema = z.object({
  publishers: z.array(
    z.object({ publisherId: z.string(), adjustment: z.number(), rationale: z.string(), concern: z.string() }),
  ),
  overallNote: z.string(),
});
export type Review = z.infer<typeof ReviewSchema>;

export const CreativeSchema = z.object({
  variants: z.array(
    z.object({
      personaId: z.string(),
      whyThisPersona: z.string(),
      angle: z.string(),
      headline: z.string(),
      body: z.string(),
      cta: z.string(),
      bestPublisherId: z.string(),
    }),
  ),
});
export type Creative = z.infer<typeof CreativeSchema>;
export type CreativeVariant = Creative["variants"][number];
export type ValidatedVariant = Omit<CreativeVariant, "bestPublisherId"> & {
  id: string;
  personaName: string;
  bestPublisherId: string | null;
};

export type Allocation = {
  publisherId: string;
  publisherName: string;
  sharePct: number;
  budgetUsd: number;
  estCpmUsd: number;
  estImpressions: number;
  pctOfMonthlyInventory: number;
  capped: boolean;
};

export type CampaignConfig = {
  name: string;
  status: "draft";
  objective: "conversions" | "traffic";
  confidence: number;
  budget: { totalUsd: number; allocatedUsd: number; unallocatedUsd: number; flightDays: number; dailyCapUsd: number; pacing: "even" };
  allocations: Allocation[];
  bidding: {
    learningPhase: { model: "CPM"; bidRangeUsd: [number, number]; days: number };
    optimizedPhase: { model: "target_CPA"; targetCpaUsd: number };
    rationale: string;
  };
  targeting: {
    personas: { id: string; name: string }[];
    gender: Brief["targetGender"];
    ageRange: [number, number] | null;
    geos: string[];
    contextualCategories: string[];
  };
  frequencyCap: { impressions: number; perDays: number };
  creativeRotation: { variantIds: string[]; strategy: string };
  measurement: { primaryKpi: string; secondaryKpis: string[] };
  assumptions: string[];
};

export type PlanResult = {
  input: { description: string; budgetUsd: number };
  brief: Brief;
  flags: Flag[];
  personas: PersonaMatch[];
  publishers: PublisherMatch[];
  reviewNote: string | null;
  creatives: ValidatedVariant[];
  config: CampaignConfig | null;
  warnings: string[];
  timingsMs: Record<string, number>;
  generatedAt: string;
};
