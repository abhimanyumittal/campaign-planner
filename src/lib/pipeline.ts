import { PUBLISHERS } from "./catalog";
import { buildCampaignConfig, DEFAULT_BUDGET_USD } from "./config";
import type { LlmSteps } from "./llm/steps";
import { applyReview, validateCreatives } from "./postprocess";
import { computeFlags } from "./scoring/flags";
import { scorePersonas } from "./scoring/personas";
import { scorePublishers } from "./scoring/publishers";
import type { PlanResult } from "./types";

const NEAR_MISSES_FOR_REVIEW = 3;
const PUBLISHER_IDS = new Set(PUBLISHERS.map((p) => p.id));

export async function runPipeline(input: { description: string; budgetUsd?: number }, llm: LlmSteps): Promise<PlanResult> {
  const timingsMs: Record<string, number> = {};
  const time = async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
    const start = Date.now();
    try {
      return await fn();
    } finally {
      timingsMs[name] = Date.now() - start;
    }
  };
  const budgetUsd = input.budgetUsd ?? DEFAULT_BUDGET_USD;
  const base = { input: { description: input.description, budgetUsd }, generatedAt: new Date().toISOString(), timingsMs };

  const brief = await time("understand", () => llm.understand(input.description));
  const personas = scorePersonas(brief);
  let publishers = scorePublishers(brief, personas);

  if (brief.status === "no_fit") {
    return { ...base, brief, personas, publishers, flags: computeFlags(brief, publishers), reviewNote: null, creatives: [], config: null, warnings: [] };
  }

  const selected = personas.filter((m) => m.selected);
  const candidates = [
    ...publishers.filter((m) => m.included),
    ...publishers.filter((m) => !m.included && m.score > 0).slice(0, NEAR_MISSES_FOR_REVIEW),
  ];
  const includedNow = publishers.filter((m) => m.included);

  // Review and creative are independent, so run them in parallel.
  const [review, creative] = await Promise.all([
    candidates.length ? time("review", () => llm.review({ brief, candidates })) : Promise.resolve(null),
    selected.length
      ? time("creative", () => llm.creative({ brief, description: input.description, personas: selected, publishers: includedNow }))
      : Promise.resolve({ variants: [] }),
  ]);

  const warnings: string[] = [];
  if (review) {
    const applied = applyReview(brief, publishers, review);
    publishers = applied.publishers;
    warnings.push(...applied.warnings);
  }
  const validated = validateCreatives(creative.variants, selected, PUBLISHER_IDS);
  warnings.push(...validated.warnings);

  const config = buildCampaignConfig({
    brief, publishers, personas: selected, variants: validated.variants, budgetUsd, budgetWasDefault: input.budgetUsd == null,
  });

  return {
    ...base, brief, personas, publishers,
    flags: computeFlags(brief, publishers),
    reviewNote: review?.overallNote ?? null,
    creatives: validated.variants,
    config, warnings,
  };
}
