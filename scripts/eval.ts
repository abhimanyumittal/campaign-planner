import fs from "node:fs";
import path from "node:path";
import { CASES } from "../evals/cases";
import { checkBaseline, checkPlan } from "../evals/check";
import { runBaseline, type BaselineResult } from "@/lib/baseline";
import { DEFAULT_BUDGET_USD } from "@/lib/config";
import { loadExamples } from "@/lib/examples";
import { modelId } from "@/lib/llm/models";
import { liveLlm } from "@/lib/llm/steps";
import { runPipeline } from "@/lib/pipeline";
import type { PlanResult } from "@/lib/types";

// Usage: npm run eval            (all 15)
//        npm run eval -- 1 7 14  (re-run a subset)
// Either way, evals/RESULTS.md is rebuilt from every saved result in public/precomputed/.
const OUT_DIR = path.join(process.cwd(), "public", "precomputed");
const fileFor = (n: number) => path.join(OUT_DIR, `example-${n}.json`);
type Saved = { plan: PlanResult; baseline: BaselineResult | null };

async function main() {
  const only = process.argv.slice(2).map(Number).filter(Boolean);
  const examples = loadExamples();
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const ex of examples.filter((e) => !only.length || only.includes(e.n))) {
    process.stdout.write(`#${ex.n} … `);
    const [plan, baseline] = await Promise.all([
      runPipeline({ description: ex.text }, liveLlm),
      runBaseline(ex.text, DEFAULT_BUDGET_USD).catch((e: Error): BaselineResult | null => {
        console.warn(`baseline failed: ${e.message}`);
        return null;
      }),
    ]);
    fs.writeFileSync(fileFor(ex.n), JSON.stringify({ plan, baseline } satisfies Saved));
    const pf = checkPlan(plan, CASES[ex.n] ?? {});
    const bf = baseline ? checkBaseline(baseline, CASES[ex.n] ?? {}) : ["baseline errored"];
    console.log(pf.length ? `pipeline ✗ (${pf.join("; ")})` : "pipeline ✓", bf.length ? `| baseline ✗ (${bf.join("; ")})` : "| baseline ✓");
  }

  const rows: string[] = [];
  let pipelinePass = 0;
  let baselinePass = 0;
  let total = 0;
  for (const ex of examples) {
    if (!fs.existsSync(fileFor(ex.n))) continue;
    const { plan, baseline } = JSON.parse(fs.readFileSync(fileFor(ex.n), "utf8")) as Saved;
    const exp = CASES[ex.n] ?? {};
    const pf = checkPlan(plan, exp);
    const bf = baseline ? checkBaseline(baseline, exp) : ["baseline errored"];
    total++;
    if (!pf.length) pipelinePass++;
    if (!bf.length) baselinePass++;
    const picks = plan.publishers.filter((m) => m.included).map((m) => m.publisher.name).join(", ") || "none";
    const bPicks = baseline?.output.publishers.map((p) => p.publisherId).join(", ") || "none";
    rows.push(`| ${ex.n} | ${ex.text.slice(0, 50).replace(/\|/g, "/")}… | ${plan.brief.status} | ${picks} | ${pf.length ? "✗ " + pf.join("; ") : "✓"} | ${bPicks} | ${baseline?.output.creatives.length ?? 0} | ${bf.length ? "✗ " + bf.join("; ") : "✓"} |`);
  }

  const md = [
    `# Eval results`,
    ``,
    `Model: \`${modelId("default")}\` · Pipeline **${pipelinePass}/${total}** · Single-prompt baseline **${baselinePass}/${total}**`,
    ``,
    `Expectations live in \`evals/cases.ts\`. They are deliberately loose: "a sensible answer", not "the one right answer".`,
    `Checks on status, flags, personas and clarifying questions don't apply to the baseline (it has none of those), so its score is generous.`,
    ``,
    `| # | Advertiser | Status | Pipeline picks | Pipeline | Baseline picks | Baseline ads | Baseline |`,
    `|---|---|---|---|---|---|---|---|`,
    ...rows,
  ].join("\n");
  fs.writeFileSync(path.join(process.cwd(), "evals", "RESULTS.md"), md + "\n");
  console.log(`\nPipeline ${pipelinePass}/${total} · Baseline ${baselinePass}/${total}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
