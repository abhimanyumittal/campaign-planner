import { decideInclusion } from "./scoring/publishers";
import type { Brief, CreativeVariant, PersonaMatch, PublisherMatch, Review, ValidatedVariant } from "./types";
import { clamp } from "./util";

export const MAX_ADJUSTMENT = 15;
export const HEADLINE_MAX = 40;
export const BODY_MAX = 125;

export function applyReview(brief: Brief, matches: PublisherMatch[], review: Review) {
  const copies = matches.map((m) => ({ ...m }));
  const byId = new Map(copies.map((m) => [m.publisher.id, m]));
  const warnings: string[] = [];
  for (const r of review.publishers) {
    const m = byId.get(r.publisherId);
    if (!m) {
      warnings.push(`Review mentioned unknown publisher "${r.publisherId}"; ignored`);
      continue;
    }
    m.adjustment = clamp(Math.round(r.adjustment), -MAX_ADJUSTMENT, MAX_ADJUSTMENT);
    m.finalScore = clamp(m.score + m.adjustment, 0, 100);
    m.rationale = r.rationale || null;
    m.concern = r.concern || null;
  }
  return { publishers: decideInclusion(brief, copies), warnings };
}

export function validateCreatives(variants: CreativeVariant[], selected: PersonaMatch[], publisherIds: Set<string>) {
  const warnings: string[] = [];
  const seen = new Set<string>();
  const out: ValidatedVariant[] = [];
  for (const v of variants) {
    const match = selected.find((m) => m.persona.id === v.personaId);
    if (!match) {
      warnings.push(`Dropped ad for unknown persona "${v.personaId}"`);
      continue;
    }
    if (seen.has(v.personaId)) {
      warnings.push(`Dropped duplicate ad for ${match.persona.name}`);
      continue;
    }
    seen.add(v.personaId);
    if (v.headline.length > HEADLINE_MAX) warnings.push(`Headline for ${match.persona.name} is ${v.headline.length} chars (limit ${HEADLINE_MAX})`);
    if (v.body.length > BODY_MAX) warnings.push(`Body for ${match.persona.name} is ${v.body.length} chars (limit ${BODY_MAX})`);
    out.push({
      ...v,
      id: `v${out.length + 1}`,
      personaName: match.persona.name,
      bestPublisherId: publisherIds.has(v.bestPublisherId) ? v.bestPublisherId : null,
    });
  }
  const missing = selected.filter((m) => !seen.has(m.persona.id)).map((m) => m.persona.name);
  if (missing.length) warnings.push(`No ad written for ${missing.join(", ")}`);
  return { variants: out, warnings };
}
