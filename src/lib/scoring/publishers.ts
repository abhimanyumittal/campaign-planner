import { PUBLISHERS, type Publisher } from "../catalog";
import { BROAD_CATEGORIES } from "../taxonomy";
import type { Brief, PersonaMatch, PublisherMatch, Reason } from "../types";
import { clamp, humanList, overlap, parseAgeRange, rangesOverlap } from "../util";

export const INCLUDE_THRESHOLD = 40;
export const MAX_INCLUDED = 6;

export function scorePublisher(brief: Brief, pub: Publisher, selected: PersonaMatch[]) {
  const reasons: Reason[] = [];
  const push = (label: string, points: number) => reasons.push({ label, points });
  const { profile } = pub;

  const cats = overlap(brief.categories, profile.categories);
  if (cats.length) {
    if (cats.every((c) => BROAD_CATEGORIES.includes(c))) push(`Sells ${humanList(cats)} (broad match)`, 10);
    else push(`Sells ${humanList(cats)}`, Math.min(45, 35 + 10 * (cats.length - 1)));
  }

  // Audience-first bridge: publishers where the chosen personas already shop.
  const bridging = selected.filter((m) => overlap(m.persona.profile.categories, profile.categories).length > 0);
  const viaPersonas = bridging.map((m) => m.persona.name);
  if (bridging.length) {
    const pts = Math.min(30, bridging.reduce((s, m) => s + (m.stretch ? 5 : 15), 0));
    push(`Shopped by ${viaPersonas.join(", ")}`, pts);
  }

  const vals = overlap(brief.values, profile.values);
  if (vals.length) push(`Audience responds to ${humanList(vals)}`, Math.min(15, 5 * vals.length));

  if (brief.purchaseModel === "subscription" && profile.subscription) push("Subscription-friendly audience", 5);

  const aov = pub.avg_order_value_usd;
  if (brief.estPriceUsd != null) {
    const ratio = brief.estPriceUsd / aov;
    if (ratio > 4) push(`Your ~$${brief.estPriceUsd} price is ${ratio.toFixed(1)}× this audience's typical $${aov} order`, -35);
    else if (ratio > 2) push(`Price is ${ratio.toFixed(1)}× this audience's typical $${aov} order`, -15);
    else if (ratio >= 0.25) push(`Price fits typical $${aov} order`, 5);
  }

  const female = pub.audience.gender_split.female;
  const pct = Math.round(female * 100);
  if (brief.targetGender === "female") {
    if (female >= 0.6) push(`${pct}% female audience`, 10);
    else if (female < 0.4) push(`Only ${pct}% female audience`, -15);
  }
  if (brief.targetGender === "male") {
    if (female >= 0.8) push(`Audience is ${pct}% female`, -30);
    else if (female >= 0.6) push(`Audience skews female (${pct}%)`, -10);
  }

  const age = parseAgeRange(pub.audience.age_skew);
  if (age && brief.targetAgeMin != null && brief.targetAgeMax != null) {
    if (rangesOverlap(age, [brief.targetAgeMin, brief.targetAgeMax])) push(`Audience age ${pub.audience.age_skew} matches`, 5);
    else push(`Audience age ${pub.audience.age_skew} misses your ${brief.targetAgeMin}-${brief.targetAgeMax} target`, -15);
  }

  if (brief.priceTier === "luxury" && pub.audience.income_tier !== "high") {
    push(`${pub.audience.income_tier}-income audience for a luxury product`, -10);
  }

  return {
    score: clamp(reasons.reduce((s, r) => s + r.points, 0), 0, 100),
    reasons,
    directCategory: cats.length > 0,
    viaPersonas,
  };
}

export function scorePublishers(brief: Brief, personas: PersonaMatch[]): PublisherMatch[] {
  const selected = personas.filter((m) => m.selected);
  const matches: PublisherMatch[] = PUBLISHERS.map((publisher) => {
    const s = scorePublisher(brief, publisher, selected);
    return {
      publisher, ...s, adjustment: 0, finalScore: s.score,
      rationale: null, concern: null, included: false, exclusionReason: null,
    };
  });
  return decideInclusion(brief, matches);
}

/** Sorts by finalScore and sets included/exclusionReason. Returns new objects. */
export function decideInclusion(brief: Brief, matches: PublisherMatch[]): PublisherMatch[] {
  const sorted = matches.map((m) => ({ ...m })).sort((a, b) => b.finalScore - a.finalScore);
  let count = 0;
  for (const m of sorted) {
    const eligible =
      brief.status !== "no_fit" &&
      m.finalScore >= INCLUDE_THRESHOLD &&
      (m.directCategory || m.viaPersonas.length > 0);
    m.included = eligible && count < MAX_INCLUDED;
    if (m.included) count++;
    m.exclusionReason = m.included ? null : explainExclusion(brief, m, eligible);
  }
  return sorted;
}

function explainExclusion(brief: Brief, m: PublisherMatch, eligible: boolean): string {
  if (brief.status === "no_fit") return "Your business is outside what this catalog's shoppers buy";
  if (eligible) return `Good fit, but ranked below the top ${MAX_INCLUDED}`;
  if (m.concern && m.adjustment < 0) return m.concern;
  const worst = [...m.reasons].sort((a, b) => a.points - b.points)[0];
  if (worst && worst.points < 0) return worst.label;
  if (!m.directCategory && m.viaPersonas.length === 0) return "No overlap with your category or likely buyers";
  return `Weak overall fit (${m.finalScore}/100, needs ${INCLUDE_THRESHOLD})`;
}
