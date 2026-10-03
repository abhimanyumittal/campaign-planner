import { expect, test } from "vitest";
import { checkPlan } from "../evals/check";
import { runPipeline } from "@/lib/pipeline";
import { DENTAL } from "./fixtures";

test("checkPlan passes a correct no_fit plan and fails a wrong expectation", async () => {
  const plan = await runPipeline({ description: "x" }, {
    understand: async () => DENTAL,
    review: async () => ({ overallNote: "", publishers: [] }),
    creative: async () => ({ variants: [] }),
  });
  expect(checkPlan(plan, { status: ["no_fit"], maxIncluded: 0 })).toEqual([]);
  expect(checkPlan(plan, { status: ["clear"] })).toHaveLength(1);
});
