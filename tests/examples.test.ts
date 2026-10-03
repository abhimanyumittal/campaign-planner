import { expect, test } from "vitest";
import { loadExamples } from "@/lib/examples";

test("parses the 15 example advertisers", () => {
  const ex = loadExamples();
  expect(ex).toHaveLength(15);
  expect(ex[6]).toMatchObject({ n: 7 });
  expect(ex[6].text).toMatch(/dental/i);
});
