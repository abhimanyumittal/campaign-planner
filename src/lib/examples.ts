import fs from "node:fs";
import path from "node:path";

export type Example = { n: number; text: string };

export function parseExamples(raw: string): Example[] {
  return raw
    .split("\n")
    .map((line) => line.match(/^(\d+)\.\s+(.+)$/))
    .filter((m): m is RegExpMatchArray => m !== null)
    .map((m) => ({ n: Number(m[1]), text: m[2].trim() }));
}

export function loadExamples(): Example[] {
  return parseExamples(fs.readFileSync(path.join(process.cwd(), "data", "example_advertisers.txt"), "utf8"));
}
