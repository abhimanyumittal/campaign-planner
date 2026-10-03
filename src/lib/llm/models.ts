import { createProviderRegistry } from "ai";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";

// Provider-agnostic: switch with LLM_MODEL="openai:<model>" or "anthropic:<model>".
const registry = createProviderRegistry({ google, openai, anthropic });

export type ModelRole = "default" | "creative";
const DEFAULT_MODEL = "google:gemini-3.5-flash";

export function modelId(role: ModelRole): string {
  const base = process.env.LLM_MODEL || DEFAULT_MODEL;
  return role === "creative" ? process.env.LLM_MODEL_CREATIVE || base : base;
}

export function getModel(role: ModelRole) {
  return registry.languageModel(modelId(role) as Parameters<typeof registry.languageModel>[0]);
}
