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

// Usage: npm run eval            (all 15; rewrites evals/RESULTS.md)
//        npm run eval -- 1 7 14  (subset; refreshes only those precomputed files)
async function main() {
  const only = process.argv.slice(2).map(Number).filter(Boolean);
  const examples = loadExamples().filter((e) => !only.length || only.includes(e.n));
  const outDir = path.join(process.cwd(), "public", "precomputed");
  fs.mkdirSync(outDir, { recursive: true });

  const rows: string[] = [];
  let pipelinePass = 0;
  let baselinePass = 0;

  for (const ex of examples) {
    process.stdout.write(`#${ex.n} … `);
    const [plan, baseline] = await Promise.all([
      runPipeline({ description: ex.text }, liveLlm),
      runBaseline(ex.text, DEFAULT_BUDGET_USD).catch((e: Error): BaselineResult | null => {
        console.warn(`baseline failed: ${e.message}`);
        return null;
      }),
    ]);
    fs.writeFileSync(path.join(outDir, `example-${ex.n}.json`), JSON.stringify({ plan, baseline }));

    const exp = CASES[ex.n] ?? {};
    const pf = checkPlan(plan, exp);
    const bf = baseline ? checkBaseline(baseline, exp) : ["baseline errored"];
    if (!pf.length) pipelinePass++;
    if (!bf.length) baselinePass++;
    const picks = plan.publishers.filter((m) => m.included).map((m) => m.publisher.name).join(", ") || "none";
    const bPicks = baseline?.output.publishers.map((p) => p.publisherId).join(", ") || "none";
    rows.push(`| ${ex.n} | ${ex.text.slice(0, 50).replace(/\|/g, "/")}… | ${plan.brief.status} | ${picks} | ${pf.length ? "✗ " + pf.join("; ") : "✓"} | ${bPicks} | ${bf.length ? "✗ " + bf.join("; ") : "✓"} |`);
    console.log(pf.length ? `pipeline ✗ (${pf.join("; ")})` : "pipeline ✓", bf.length ? `| baseline ✗ (${bf.join("; ")})` : "| baseline ✓");
  }

  const md = [
    `# Eval results`,
    ``,
    `Model: \`${modelId("default")}\` · ${new Date().toISOString()} · Pipeline **${pipelinePass}/${examples.length}** · Single-prompt baseline **${baselinePass}/${examples.length}**`,
    ``,
    `Expectations live in \`evals/cases.ts\`. They are deliberately loose: "a sensible answer", not "the one right answer".`,
    ``,
    `| # | Advertiser | Status | Pipeline picks | Pipeline | Baseline picks | Baseline |`,
    `|---|---|---|---|---|---|---|`,
    ...rows,
  ].join("\n");
  if (!only.length) fs.writeFileSync(path.join(process.cwd(), "evals", "RESULTS.md"), md + "\n");
  console.log(`\nPipeline ${pipelinePass}/${examples.length} · Baseline ${baselinePass}/${examples.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
