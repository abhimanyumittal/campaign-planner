"use client";

import { useState } from "react";
import type { PlanResult } from "@/lib/types";

export default function ConfigSection({ plan }: { plan: PlanResult }) {
  const [copied, setCopied] = useState(false);
  const cfg = plan.config;
  if (!cfg) return null;
  const json = JSON.stringify(cfg, null, 2);
  const [lo, hi] = cfg.bidding.learningPhase.bidRangeUsd;

  return (
    <section className="space-y-4">
      <h2 className="font-display text-2xl font-semibold">Campaign config</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Objective" value={cfg.objective} />
        <Stat label={`Budget · ${cfg.budget.flightDays} days`} value={`$${cfg.budget.allocatedUsd.toLocaleString()}`} note={`$${cfg.budget.dailyCapUsd}/day, even pacing`} />
        <Stat label={`CPM bid · first ${cfg.bidding.learningPhase.days} days`} value={`$${lo}–$${hi}`} />
        <Stat label="Then target CPA" value={`$${cfg.bidding.optimizedPhase.targetCpaUsd}`} />
      </div>

      <div className="overflow-x-auto rounded-lg bg-paper shadow-sm">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-muted">
            <tr className="border-b border-rule">
              <th className="p-3 font-medium">Publisher</th>
              <th className="p-3 text-right font-medium">Share</th>
              <th className="p-3 text-right font-medium">Budget</th>
              <th className="p-3 text-right font-medium">Est. CPM</th>
              <th className="p-3 text-right font-medium">Est. impressions</th>
              <th className="p-3 text-right font-medium">Of monthly inventory</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {cfg.allocations.map((a) => (
              <tr key={a.publisherId} className="border-b border-rule last:border-0">
                <td className="p-3 font-sans">{a.publisherName}{a.capped && <span className="ml-2 text-xs text-warn">capped</span>}</td>
                <td className="p-3 text-right">{a.sharePct}%</td>
                <td className="p-3 text-right">${a.budgetUsd.toLocaleString()}</td>
                <td className="p-3 text-right">${a.estCpmUsd}</td>
                <td className="p-3 text-right">{a.estImpressions.toLocaleString()}</td>
                <td className="p-3 text-right">{a.pctOfMonthlyInventory}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <dl className="grid gap-4 text-sm md:grid-cols-2">
        <div><dt className="font-medium">Bidding</dt><dd className="text-muted">{cfg.bidding.rationale}</dd></div>
        <div>
          <dt className="font-medium">Targeting</dt>
          <dd className="text-muted">
            {cfg.targeting.personas.map((p) => p.name).join(", ") || "No persona targeting"} · {cfg.targeting.gender} gender
            {cfg.targeting.ageRange && ` · ages ${cfg.targeting.ageRange[0]}–${cfg.targeting.ageRange[1]}`} · {cfg.targeting.geos.join(", ")} · cap {cfg.frequencyCap.impressions} ads per person per {cfg.frequencyCap.perDays} days
          </dd>
        </div>
        <div><dt className="font-medium">Ad rotation</dt><dd className="text-muted">{cfg.creativeRotation.strategy}</dd></div>
        <div><dt className="font-medium">Success measure</dt><dd className="text-muted">{cfg.measurement.primaryKpi}, then {cfg.measurement.secondaryKpis.join(", ")}</dd></div>
      </dl>

      <details className="text-sm">
        <summary className="cursor-pointer font-medium">Assumptions behind these numbers ({cfg.assumptions.length})</summary>
        <ul className="mt-2 ml-5 list-disc space-y-1 text-muted">{cfg.assumptions.map((a) => <li key={a}>{a}</li>)}</ul>
      </details>

      <details className="text-sm">
        <summary className="cursor-pointer font-medium">Config as JSON</summary>
        <button
          type="button"
          className="my-2 rounded-md border border-rule bg-paper px-2 py-1 text-xs"
          onClick={async () => {
            await navigator.clipboard.writeText(json);
            setCopied(true);
          }}
        >
          {copied ? "Copied" : "Copy JSON"}
        </button>
        <pre className="max-h-96 overflow-auto rounded-md bg-ink p-4 font-mono text-xs text-mist">{json}</pre>
      </details>
    </section>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-lg bg-paper p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 font-mono text-xl">{value}</p>
      {note && <p className="text-xs text-muted">{note}</p>}
    </div>
  );
}
