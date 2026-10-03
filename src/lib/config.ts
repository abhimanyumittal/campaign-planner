import { publisherById, type Publisher } from "./catalog";
import type { Allocation, Brief, CampaignConfig, PersonaMatch, PublisherMatch, ValidatedVariant } from "./types";
import { round } from "./util";

export const DEFAULT_BUDGET_USD = 10_000;
export const FLIGHT_DAYS = 30;
export const MAX_INVENTORY_SHARE = 0.25;
export const MIN_ALLOCATION_USD = 250;
const LEARNING_DAYS = 14;
const BASE_CPM: Record<string, number> = { mid: 10, "mid-high": 14, high: 20 };

export function estimateCpm(pub: Publisher): number {
  const base = BASE_CPM[pub.audience.income_tier] ?? 12;
  return round(pub.monthly_impressions < 5_000_000 ? base * 1.15 : base, 2);
}

const capUsd = (pub: Publisher) => ((pub.monthly_impressions * MAX_INVENTORY_SHARE) / 1000) * estimateCpm(pub);
const weight = (m: PublisherMatch) => m.finalScore ** 2;

export function allocateBudget(matches: PublisherMatch[], totalUsd: number): { allocations: Allocation[]; unallocatedUsd: number } {
  let pool = matches.filter((m) => m.included);

  // Drop publishers whose share would be too small to learn anything from.
  while (pool.length > 1) {
    const sum = pool.reduce((s, m) => s + weight(m), 0);
    const smallest = pool.reduce((a, b) => (weight(a) < weight(b) ? a : b));
    if ((totalUsd * weight(smallest)) / sum >= MIN_ALLOCATION_USD) break;
    pool = pool.filter((m) => m !== smallest);
  }

  // Water-fill by score², never buying more than MAX_INVENTORY_SHARE of a publisher's monthly impressions.
  const usd = new Map<string, number>();
  let open = [...pool];
  let remaining = totalUsd;
  while (open.length) {
    const sum = open.reduce((s, m) => s + weight(m), 0);
    const over = open.find((m) => (remaining * weight(m)) / sum > capUsd(m.publisher));
    if (!over) {
      open.forEach((m) => usd.set(m.publisher.id, (remaining * weight(m)) / sum));
      remaining = 0;
      break;
    }
    usd.set(over.publisher.id, capUsd(over.publisher));
    remaining -= capUsd(over.publisher);
    open = open.filter((m) => m !== over);
  }

  const allocations = pool.map((m): Allocation => {
    const cpm = estimateCpm(m.publisher);
    const budget = usd.get(m.publisher.id) ?? 0;
    const imps = (budget / cpm) * 1000;
    return {
      publisherId: m.publisher.id,
      publisherName: m.publisher.name,
      sharePct: round((100 * budget) / totalUsd, 1),
      budgetUsd: round(budget),
      estCpmUsd: cpm,
      estImpressions: Math.round(imps),
      pctOfMonthlyInventory: round((100 * imps) / m.publisher.monthly_impressions, 2),
      capped: Math.abs(budget - capUsd(m.publisher)) < 0.01,
    };
  });
  return { allocations, unallocatedUsd: round(remaining) };
}

export function buildCampaignConfig(args: {
  brief: Brief;
  publishers: PublisherMatch[];
  personas: PersonaMatch[];
  variants: ValidatedVariant[];
  budgetUsd: number;
  budgetWasDefault: boolean;
}): CampaignConfig | null {
  const { brief, publishers, personas, variants, budgetUsd, budgetWasDefault } = args;
  const { allocations, unallocatedUsd } = allocateBudget(publishers, budgetUsd);
  if (!allocations.length) return null;

  const spent = allocations.reduce((s, a) => s + a.budgetUsd, 0);
  const pubs = allocations.map((a) => publisherById(a.publisherId)!);
  const weightedCpm = allocations.reduce((s, a) => s + a.budgetUsd * a.estCpmUsd, 0) / spent;
  const weightedAov = allocations.reduce((s, a, i) => s + a.budgetUsd * pubs[i].avg_order_value_usd, 0) / spent;
  const orderValue = brief.estPriceUsd ?? weightedAov;
  const isSubscription = brief.purchaseModel === "subscription";
  const objective = brief.status === "vague" ? "traffic" : "conversions";

  return {
    name: `${brief.productSummary.slice(0, 60)} (draft)`,
    status: "draft",
    objective,
    confidence: brief.confidence,
    budget: {
      totalUsd: budgetUsd,
      allocatedUsd: round(spent),
      unallocatedUsd,
      flightDays: FLIGHT_DAYS,
      dailyCapUsd: round(spent / FLIGHT_DAYS),
      pacing: "even",
    },
    allocations,
    bidding: {
      learningPhase: { model: "CPM", bidRangeUsd: [round(weightedCpm * 0.8, 2), round(weightedCpm * 1.2, 2)], days: LEARNING_DAYS },
      optimizedPhase: { model: "target_CPA", targetCpaUsd: round(isSubscription ? orderValue : orderValue * 0.3) },
      rationale: `Start on CPM bids for ${LEARNING_DAYS} days to buy reach and collect conversion data (there is no history yet), then switch to a target CPA once each publisher has ~30 conversions.`,
    },
    targeting: {
      personas: personas.map((m) => ({ id: m.persona.id, name: m.persona.name })),
      gender: brief.targetGender,
      ageRange: brief.targetAgeMin != null && brief.targetAgeMax != null ? [brief.targetAgeMin, brief.targetAgeMax] : null,
      geos: pubs.some((p) => p.audience.top_geos.includes("nationwide"))
        ? ["US (nationwide)"]
        : [...new Set(pubs.flatMap((p) => p.audience.top_geos))],
      contextualCategories: brief.categories,
    },
    frequencyCap: { impressions: 3, perDays: 7 },
    creativeRotation: {
      variantIds: variants.map((v) => v.id),
      strategy: `Even rotation for ${LEARNING_DAYS} days, then shift weight to the best CTR per publisher.`,
    },
    measurement: objective === "conversions"
      ? { primaryKpi: "CPA", secondaryKpis: ["Conversion rate", "CTR", "ROAS"] }
      : { primaryKpi: "CPC", secondaryKpis: ["CTR", "Landing-page engagement"] },
    assumptions: [
      ...(budgetWasDefault ? [`No budget given: assumed $${budgetUsd.toLocaleString()} for a ${FLIGHT_DAYS}-day test.`] : []),
      "CPMs are estimated from each audience's income tier (+15% for audiences under 5M monthly impressions); real prices come from the auction.",
      brief.estPriceUsd == null
        ? `No price given: used the spend-weighted publisher AOV (~$${round(weightedAov)}) as order value.`
        : `Order value taken as ~$${brief.estPriceUsd}.`,
      isSubscription
        ? "Subscription: target CPA ≈ one order's value, since subscribers repeat."
        : "One-time purchase: target CPA = 30% of order value as a margin-safe default.",
      `No publisher gets more than ${MAX_INVENTORY_SHARE * 100}% of its monthly impressions, so no single audience is saturated.`,
      ...(unallocatedUsd > 0 ? [`$${unallocatedUsd.toLocaleString()} left unallocated: the recommended publishers can't absorb more without saturating.`] : []),
      ...brief.assumptions,
    ],
  };
}
