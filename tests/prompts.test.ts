import { describe, expect, test } from "vitest";
import { fillPrompt, loadPrompt } from "@/lib/llm/prompts";

describe("prompts", () => {
  test("fillPrompt substitutes variables", () => {
    expect(fillPrompt("Hi {{name}}!", { name: "Ada" })).toBe("Hi Ada!");
  });

  test("fillPrompt throws on a missing variable", () => {
    expect(() => fillPrompt("Hi {{name}}", {})).toThrow(/name/);
  });

  test("understand.md loads with no leftover placeholders", () => {
    const p = loadPrompt("understand.md", { categories: "a", values: "b" });
    expect(p).not.toMatch(/\{\{/);
    expect(p).toContain("no_fit");
  });
});
