import { describe, expect, test, vi } from "vitest";
import { runPipeline } from "@/lib/pipeline";
import type { CreativeInput, LlmSteps } from "@/lib/llm/steps";
import { DENTAL, DOG_FOOD } from "./fixtures";

function stubLlm(brief = DOG_FOOD): LlmSteps {
  return {
    understand: vi.fn(async () => brief),
    review: vi.fn(async () => ({ overallNote: "ok", publishers: [] })),
    creative: vi.fn(async ({ personas }: CreativeInput) => ({
      variants: personas.map((m) => ({
        personaId: m.persona.id, whyThisPersona: "w", angle: "a", headline: "H", body: "B", cta: "Shop", bestPublisherId: "pub_007",
      })),
    })),
  };
}

describe("runPipeline", () => {
  test("clear brief → publishers, one ad per selected persona, config", async () => {
    const llm = stubLlm();
    const res = await runPipeline({ description: "dog food" }, llm);
    const selected = res.personas.filter((m) => m.selected);
    expect(res.creatives).toHaveLength(selected.length);
    expect(res.config?.allocations.length).toBeGreaterThan(0);
    expect(res.input.budgetUsd).toBe(10_000);
    expect(llm.review).toHaveBeenCalledOnce();
  });

  test("no_fit → skips review and creative, no config", async () => {
    const llm = stubLlm(DENTAL);
    const res = await runPipeline({ description: "dental SaaS" }, llm);
    expect(llm.review).not.toHaveBeenCalled();
    expect(llm.creative).not.toHaveBeenCalled();
    expect(res.config).toBeNull();
    expect(res.flags.map((f) => f.code)).toContain("no_fit");
  });
});
