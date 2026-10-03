import { expect, test } from "vitest";
import { diagnoseBaseline } from "@/lib/baseline";

test("diagnoseBaseline flags invented ids and bad budget totals", () => {
  const d = diagnoseBaseline({
    understanding: "", bidStrategy: "",
    publishers: [{ publisherId: "pub_007", rationale: "" }, { publisherId: "pub_777", rationale: "" }],
    excluded: [],
    creatives: [{ personaId: "persona_042", headline: "", body: "" }],
    budgetSplit: [{ publisherId: "pub_007", percent: 70 }, { publisherId: "pub_777", percent: 50 }],
  });
  expect(d.unknownPublisherIds).toEqual(["pub_777"]);
  expect(d.unknownPersonaIds).toEqual(["persona_042"]);
  expect(d.budgetSplitTotalPct).toBe(120);
});
