import { expect, test } from "vitest";
import publishers from "../data/publishers.json";

test("catalog loads", () => {
  expect(publishers).toHaveLength(20);
});
