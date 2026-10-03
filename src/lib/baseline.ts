import { generateText, Output } from "ai";
import { z } from "zod";
import publishersJson from "../../data/publishers.json";
import personasJson from "../../data/shopper_personas.json";
import { getModel } from "./llm/models";
import { loadPrompt, wrapDescription } from "./llm/prompts";

// The comparison point: one LLM call decides everything, no rules, no validation.

export const BaselineSchema = z.object({
  understanding: z.string(),
  publishers: z.array(z.object({ publisherId: z.string(), rationale: z.string() })),
  excluded: z.array(z.object({ publisherId: z.string(), reason: z.string() })),
  creatives: z.array(z.object({ personaId: z.string(), headline: z.string(), body: z.string() })),
  budgetSplit: z.array(z.object({ publisherId: z.string(), percent: z.number() })),
  bidStrategy: z.string(),
});
export type BaselineOutput = z.infer<typeof BaselineSchema>;
export type BaselineResult = {
  output: BaselineOutput;
  diagnostics: { unknownPublisherIds: string[]; unknownPersonaIds: string[]; budgetSplitTotalPct: number };
  durationMs: number;
};

const PUB_IDS = new Set(publishersJson.map((p) => p.id));
const PERSONA_IDS = new Set(personasJson.map((p) => p.id));

export function diagnoseBaseline(o: BaselineOutput): BaselineResult["diagnostics"] {
  const pubIds = [...o.publishers.map((p) => p.publisherId), ...o.excluded.map((p) => p.publisherId), ...o.budgetSplit.map((b) => b.publisherId)];
  return {
    unknownPublisherIds: [...new Set(pubIds.filter((id) => !PUB_IDS.has(id)))],
    unknownPersonaIds: [...new Set(o.creatives.map((c) => c.personaId).filter((id) => !PERSONA_IDS.has(id)))],
    budgetSplitTotalPct: o.budgetSplit.reduce((s, b) => s + b.percent, 0),
  };
}

export async function runBaseline(description: string, budgetUsd: number): Promise<BaselineResult> {
  const start = Date.now();
  const { output } = await generateText({
    model: getModel("default"),
    system: loadPrompt("baseline.md", {
      publishers: JSON.stringify(publishersJson),
      personas: JSON.stringify(personasJson),
      budget: budgetUsd.toLocaleString(),
    }),
    prompt: wrapDescription(description),
    output: Output.object({ schema: BaselineSchema, name: "campaign_plan" }),
    maxOutputTokens: 12000,
  });
  return { output, diagnostics: diagnoseBaseline(output), durationMs: Date.now() - start };
}
