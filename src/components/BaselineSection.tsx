import type { BaselineResult } from "@/lib/baseline";
import { publisherById } from "@/lib/catalog";
import type { PlanResult } from "@/lib/types";

export default function BaselineSection({ plan, baseline, loading, onCompare }: {
  plan: PlanResult;
  baseline: BaselineResult | null;
  loading: boolean;
  onCompare: () => void;
}) {
  const ours = plan.publishers.filter((m) => m.included).map((m) => m.publisher.name);
  const theirs = baseline?.output.publishers.map((p) => publisherById(p.publisherId)?.name ?? `${p.publisherId} (not in catalog)`) ?? [];
  const d = baseline?.diagnostics;
  return (
    <section className="space-y-3 rounded-lg border border-dashed border-rule p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-semibold">Compare with a single prompt</h2>
        {!baseline && (
          <button type="button" className="rounded-md border border-rule bg-paper px-3 py-1.5 text-sm disabled:opacity-40" onClick={onCompare} disabled={loading}>
            {loading ? "Running…" : "Run single-prompt version"}
          </button>
        )}
      </div>
      <p className="max-w-3xl text-sm text-muted">
        Same input and catalog, but one LLM call picks publishers, writes ads and splits the budget, with no scoring rules or checks.
      </p>
      {baseline && d && (
        <div className="grid gap-4 text-sm md:grid-cols-2">
          <PickList title="This planner" items={ours} />
          <PickList title="Single prompt" items={theirs} />
          <ul className="space-y-0.5 font-mono text-xs text-muted md:col-span-2">
            <li>Single prompt invented publisher IDs: {d.unknownPublisherIds.join(", ") || "none"}</li>
            <li>Single prompt invented persona IDs: {d.unknownPersonaIds.join(", ") || "none"}</li>
            <li>Single prompt budget split adds up to {d.budgetSplitTotalPct}%</li>
          </ul>
        </div>
      )}
    </section>
  );
}

function PickList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="font-medium">{title}</p>
      {items.length ? <ol className="ml-5 list-decimal">{items.map((n) => <li key={n}>{n}</li>)}</ol> : <p className="text-muted">No publishers recommended</p>}
    </div>
  );
}
