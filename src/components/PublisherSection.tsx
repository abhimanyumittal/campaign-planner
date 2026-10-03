import { INCLUDE_THRESHOLD } from "@/lib/scoring/publishers";
import type { PlanResult } from "@/lib/types";
import ReasonChips from "./ReasonChips";
import ScoreLedger from "./ScoreLedger";

export default function PublisherSection({ plan }: { plan: PlanResult }) {
  const included = plan.publishers.filter((m) => m.included);
  const excluded = plan.publishers.filter((m) => !m.included);
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-2xl font-semibold">Where to advertise</h2>
        <Legend />
      </div>
      {plan.reviewNote && <p className="max-w-3xl text-sm text-muted">{plan.reviewNote}</p>}
      {included.length === 0 && (
        <p className="rounded-md bg-paper p-4 text-sm">
          No publisher in this catalog clears the bar for this business. The closest options and why they miss are listed below.
        </p>
      )}

      <ol className="space-y-3">
        {included.map((m, i) => (
          <li key={m.publisher.id} className="space-y-3 rounded-lg bg-paper p-5 shadow-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-display text-lg font-semibold">
                <span className="mr-2 font-mono text-sm text-muted">#{i + 1}</span>
                {m.publisher.name}
                <span className="ml-2 text-sm font-normal text-muted">{m.publisher.category.replace("_", " ")} · AOV ${m.publisher.avg_order_value_usd}</span>
              </h3>
              <p className="font-mono text-sm">
                {m.finalScore}<span className="text-muted">/100</span>
                {m.adjustment !== 0 && (
                  <span className="ml-2 text-xs text-review">rules {m.score} {m.adjustment > 0 ? "+" : "−"} {Math.abs(m.adjustment)} reviewer</span>
                )}
              </p>
            </div>
            <ScoreLedger reasons={m.reasons} adjustment={m.adjustment} finalScore={m.finalScore} threshold={INCLUDE_THRESHOLD} />
            {m.rationale && <p className="text-sm">{m.rationale}</p>}
            <ReasonChips reasons={m.reasons} />
            {m.concern && <p className="text-xs text-review">Reviewer note: {m.concern}</p>}
          </li>
        ))}
      </ol>

      <details className="rounded-lg bg-paper p-5 shadow-sm" open={included.length === 0}>
        <summary className="cursor-pointer font-medium">Not recommended ({excluded.length})</summary>
        <ul className="mt-3 divide-y divide-rule text-sm">
          {excluded.map((m) => (
            <li key={m.publisher.id} className="grid gap-1 py-2 sm:grid-cols-[180px_48px_1fr] sm:gap-4">
              <span className="font-medium">{m.publisher.name}</span>
              <span className="font-mono text-muted">{m.finalScore}</span>
              <span className="text-muted">{m.exclusionReason}</span>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}

function Legend() {
  return (
    <ul className="flex flex-wrap gap-3 text-xs text-muted" aria-label="Score bar legend">
      <li className="flex items-center gap-1"><span className="inline-block h-2 w-3 bg-pos" /> rule points</li>
      <li className="flex items-center gap-1"><span className="hatch inline-block h-2 w-3 bg-neg-soft text-neg" /> penalties</li>
      <li className="flex items-center gap-1"><span className="inline-block h-2 w-3 bg-review" /> reviewer</li>
      <li className="flex items-center gap-1"><span className="inline-block h-3 w-px bg-muted" /> bar to recommend ({INCLUDE_THRESHOLD})</li>
    </ul>
  );
}
