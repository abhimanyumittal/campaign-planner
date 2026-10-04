import { PERSONAS, type Persona } from "../catalog";
import { BROAD_CATEGORIES } from "../taxonomy";
import type { Brief, PersonaMatch, PublisherMatch, Reason } from "../types";
import { clamp, humanList, overlap, parseAgeRange, rangesOverlap } from "../util";

export const PERSONA_SELECT_THRESHOLD = 40;
export const PERSONA_STRETCH_THRESHOLD = 20;
export const MIN_PERSONAS = 3; // the brief asks for 3–5 ad variants
const MAX_PERSONAS = 5;

// Points for (advertiser price tier × persona price sensitivity). Missing = 0.
const PRICE_FIT: Record<Brief["priceTier"], Record<string, number>> = {
  luxury: { low: 10, "low-medium": 0, medium: -10, "medium-high": -20, high: -30 },
  premium: { low: 10, "low-medium": 5, medium: 0, "medium-high": -10, high: -20 },
  mid: {},
  budget: { low: -5, "medium-high": 5, high: 10 },
  unknown: {},
};

export function scorePersona(brief: Brief, persona: Persona): { score: number; reasons: Reason[] } {
  const reasons: Reason[] = [];
  const { profile } = persona;

  const cats = overlap(brief.categories, profile.categories);
  if (cats.length) {
    const broadOnly = cats.every((c) => BROAD_CATEGORIES.includes(c));
    reasons.push(broadOnly
      ? { label: `Shops ${humanList(cats)} (broad match)`, points: 15 }
      : { label: `Shops ${humanList(cats)}`, points: Math.min(55, 40 + 10 * (cats.length - 1)) });
  }

  const vals = overlap(brief.values, profile.values);
  if (vals.length) reasons.push({ label: `Cares about ${humanList(vals)}`, points: Math.min(25, 10 * vals.length) });

  const price = PRICE_FIT[brief.priceTier][persona.price_sensitivity] ?? 0;
  if (price !== 0) {
    reasons.push({ label: `${persona.price_sensitivity} price sensitivity vs ${brief.priceTier} pricing`, points: price });
  }

  if (brief.targetGender === "male" && persona.gender_skew.startsWith("female")) {
    reasons.push({ label: `Skews ${persona.gender_skew}; product targets men`, points: persona.gender_skew === "female" ? -20 : -10 });
  }

  const age = parseAgeRange(persona.age_range);
  if (age && brief.targetAgeMin != null && brief.targetAgeMax != null && !rangesOverlap(age, [brief.targetAgeMin, brief.targetAgeMax])) {
    reasons.push({ label: `Age ${persona.age_range} outside target`, points: -15 });
  }

  const anti = overlap(brief.values, profile.antiValues);
  if (anti.length) reasons.push({ label: `Turned off by ${humanList(anti)}`, points: -25 * anti.length });

  if (profile.avoidsSubscription && brief.purchaseModel === "subscription") {
    reasons.push({ label: "Avoids subscription-only offers", points: -20 });
  }

  return { score: clamp(reasons.reduce((s, r) => s + r.points, 0), 0, 100), reasons };
}

export function scorePersonas(brief: Brief): PersonaMatch[] {
  const scored: PersonaMatch[] = PERSONAS.map((persona) => ({
    persona, ...scorePersona(brief, persona), selected: false, stretch: false, fillReason: null,
  })).sort((a, b) => b.score - a.score);

  if (brief.status === "no_fit") return scored;

  const strong = scored.filter((m) => m.score >= PERSONA_SELECT_THRESHOLD).slice(0, MAX_PERSONAS);
  const stretch = scored
    .filter((m) => m.score < PERSONA_SELECT_THRESHOLD && m.score >= PERSONA_STRETCH_THRESHOLD)
    .slice(0, Math.max(0, MIN_PERSONAS - strong.length));
  strong.forEach((m) => (m.selected = true));
  stretch.forEach((m) => {
    m.selected = true;
    m.stretch = true;
  });
  return scored;
}

// A penalty this large means the pitch actively turns the persona off (anti-value, gender mismatch).
const HARD_TURN_OFF = -20;

const CLOSEST_PUBLISHERS = 3;

/**
 * Runs after publishers are scored. If fewer than MIN_PERSONAS were selected, adds the personas who
 * shop where the ads will run: first the recommended publishers, then the closest near-misses, then
 * the next-best persona scores. So there are always at least 3 ads. Fill-ins never feed back into
 * publisher scoring. Skipped for out-of-scope or zero-signal briefs.
 */
export function fillPersonas(brief: Brief, personas: PersonaMatch[], publishers: PublisherMatch[]): PersonaMatch[] {
  const result = personas.map((m) => ({ ...m }));
  const missing = MIN_PERSONAS - result.filter((m) => m.selected).length;
  if (missing <= 0 || brief.status === "no_fit" || brief.categories.length === 0) return result;

  const included = publishers.filter((p) => p.included);
  const nearMisses = publishers
    .filter((p) => !p.included && p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, CLOSEST_PUBLISHERS);
  const shopsAmong = (m: PersonaMatch, pubs: PublisherMatch[]) =>
    pubs.filter((p) => overlap(m.persona.profile.categories, p.publisher.profile.categories).length > 0);

  const candidates = result
    .filter((m) => !m.selected && !m.reasons.some((r) => r.points <= HARD_TURN_OFF))
    .sort((a, b) =>
      shopsAmong(b, included).length - shopsAmong(a, included).length ||
      shopsAmong(b, nearMisses).length - shopsAmong(a, nearMisses).length ||
      b.score - a.score)
    .slice(0, missing);

  for (const m of candidates) {
    const atIncluded = shopsAmong(m, included).map((p) => p.publisher.name);
    const atNear = shopsAmong(m, nearMisses).map((p) => p.publisher.name);
    m.selected = true;
    m.fillReason = atIncluded.length
      ? `Added so there are 3 ads: secondary audience that shops at ${atIncluded.join(", ")}`
      : atNear.length
        ? `Added so there are 3 ads: secondary audience that shops at nearby options (${atNear.join(", ")})`
        : "Added so there are 3 ads: closest remaining audience";
  }
  return result;
}
