import { generateText, Output } from "ai";
import { INCLUDE_THRESHOLD } from "../scoring/publishers";
import { CATEGORIES, VALUES } from "../taxonomy";
import {
  BriefSchema, CreativeSchema, ReviewSchema,
  type Brief, type Creative, type PersonaMatch, type PublisherMatch, type Review,
} from "../types";
import { getModel } from "./models";
import { loadPrompt, wrapDescription } from "./prompts";

const MAX_OUTPUT_TOKENS = 8000; // includes model thinking tokens on Gemini

export type ReviewInput = { brief: Brief; candidates: PublisherMatch[] };
export type CreativeInput = { brief: Brief; description: string; personas: PersonaMatch[]; publishers: PublisherMatch[] };
export type LlmSteps = {
  understand(description: string): Promise<Brief>;
  review(input: ReviewInput): Promise<Review>;
  creative(input: CreativeInput): Promise<Creative>;
};

const json = (v: unknown) => JSON.stringify(v, null, 2);
const briefForPrompt = (b: Brief) => json({ ...b, assumptions: undefined, clarifyingQuestions: undefined });

export async function understand(description: string): Promise<Brief> {
  const { output } = await generateText({
    model: getModel("default"),
    system: loadPrompt("understand.md", { categories: CATEGORIES.join(", "), values: VALUES.join(", ") }),
    prompt: wrapDescription(description),
    output: Output.object({ schema: BriefSchema, name: "brief" }),
    maxOutputTokens: MAX_OUTPUT_TOKENS,
  });
  return output;
}

export async function review({ brief, candidates }: ReviewInput): Promise<Review> {
  const rows = candidates.map((m) => ({
    publisherId: m.publisher.id,
    name: m.publisher.name,
    category: m.publisher.category,
    subcategories: m.publisher.subcategories,
    audience: m.publisher.audience,
    avgOrderValueUsd: m.publisher.avg_order_value_usd,
    notes: m.publisher.notes,
    ruleScore: m.score,
    ruleReasons: m.reasons.map((r) => `${r.points > 0 ? "+" : ""}${r.points} ${r.label}`),
  }));
  const { output } = await generateText({
    model: getModel("default"),
    prompt: loadPrompt("review.md", { brief: briefForPrompt(brief), candidates: json(rows), threshold: String(INCLUDE_THRESHOLD) }),
    output: Output.object({ schema: ReviewSchema, name: "review" }),
    maxOutputTokens: MAX_OUTPUT_TOKENS,
  });
  return output;
}

export async function creative({ brief, description, personas, publishers }: CreativeInput): Promise<Creative> {
  const personaRows = personas.map((m) => ({
    personaId: m.persona.id,
    name: m.persona.name,
    description: m.persona.description,
    age_range: m.persona.age_range,
    price_sensitivity: m.persona.price_sensitivity,
    messaging_preferences: m.persona.messaging_preferences,
    disinterested_in: m.persona.disinterested_in,
    whyMatched: m.reasons.filter((r) => r.points > 0).map((r) => r.label),
    matchStrength: m.fillReason || m.stretch ? "secondary" : "primary",
  }));
  const pubRows = publishers.map((m) => ({ publisherId: m.publisher.id, name: m.publisher.name, notes: m.publisher.notes }));
  const { output } = await generateText({
    model: getModel("creative"),
    prompt: loadPrompt("creative.md", {
      brief: briefForPrompt(brief),
      description: wrapDescription(description),
      personas: json(personaRows),
      publishers: json(pubRows),
    }),
    output: Output.object({ schema: CreativeSchema, name: "creatives" }),
    maxOutputTokens: MAX_OUTPUT_TOKENS,
  });
  return output;
}

export const liveLlm: LlmSteps = { understand, review, creative };
