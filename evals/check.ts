import type { BaselineResult } from "@/lib/baseline";
import type { PlanResult } from "@/lib/types";
import type { Expectation } from "./cases";

function checkRanking(ids: string[], exp: Expectation, f: string[]) {
  const n = exp.topN ?? 3;
  if (exp.topIncludesAny && !exp.topIncludesAny.some((id) => ids.slice(0, n).includes(id))) {
    f.push(`top ${n} [${ids.slice(0, n).join(", ")}] has none of [${exp.topIncludesAny.join(", ")}]`);
  }
  for (const id of exp.excludes ?? []) if (ids.includes(id)) f.push(`${id} should not be recommended`);
  if (exp.maxIncluded != null && ids.length > exp.maxIncluded) f.push(`${ids.length} publishers recommended, max ${exp.maxIncluded}`);
  if (exp.minIncluded != null && ids.length < exp.minIncluded) f.push(`${ids.length} publishers recommended, min ${exp.minIncluded}`);
}

export function checkPlan(plan: PlanResult, exp: Expectation): string[] {
  const f: string[] = [];
  if (exp.status && !exp.status.includes(plan.brief.status)) f.push(`status "${plan.brief.status}", expected ${exp.status.join("|")}`);
  checkRanking(plan.publishers.filter((m) => m.included).map((m) => m.publisher.id), exp, f);
  const personas = plan.personas.filter((m) => m.selected).map((m) => m.persona.id);
  if (exp.personasIncludeAny && !exp.personasIncludeAny.some((id) => personas.includes(id))) f.push(`personas [${personas.join(", ")}] miss [${exp.personasIncludeAny.join(", ")}]`);
  const flags = plan.flags.map((x) => x.code);
  if (exp.flagsIncludeAny && !exp.flagsIncludeAny.some((c) => flags.includes(c))) f.push(`flags [${flags.join(", ")}] miss [${exp.flagsIncludeAny.join(", ")}]`);
  if (exp.minQuestions && plan.brief.clarifyingQuestions.length < exp.minQuestions) f.push("no clarifying questions");
  // The brief asks for 3–5 ad variants whenever there is something to advertise.
  const advertisable = plan.brief.status !== "no_fit" && plan.brief.categories.length > 0;
  if (advertisable && (plan.creatives.length < 3 || plan.creatives.length > 5)) f.push(`${plan.creatives.length} ads, expected 3–5`);
  return f;
}

/** The baseline has no status, flags or persona scoring, so only ranking and integrity checks apply. */
export function checkBaseline(b: BaselineResult, exp: Expectation): string[] {
  const f: string[] = [];
  checkRanking(b.output.publishers.map((p) => p.publisherId), exp, f);
  if (b.diagnostics.unknownPublisherIds.length) f.push(`invented publishers: ${b.diagnostics.unknownPublisherIds.join(", ")}`);
  if (b.diagnostics.unknownPersonaIds.length) f.push(`invented personas: ${b.diagnostics.unknownPersonaIds.join(", ")}`);
  if (b.output.budgetSplit.length && Math.abs(b.diagnostics.budgetSplitTotalPct - 100) > 2) f.push(`budget sums to ${b.diagnostics.budgetSplitTotalPct}%`);
  return f;
}
