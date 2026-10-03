"use client";

import { useState } from "react";
import type { PlanResult } from "@/lib/types";

const STATUS: Record<PlanResult["brief"]["status"], { label: string; cls: string }> = {
  clear: { label: "Clear brief", cls: "bg-pos-soft text-pos" },
  vague: { label: "Low signal: best guess", cls: "bg-warn-soft text-warn" },
  no_fit: { label: "Outside this catalog", cls: "bg-neg-soft text-neg" },
};

export default function BriefCard({ plan, onAnswer, busy }: { plan: PlanResult; onAnswer: (q: string[], a: string[]) => void; busy: boolean }) {
  const { brief, flags } = plan;
  const [answers, setAnswers] = useState<string[]>([]);
  const status = STATUS[brief.status];
  return (
    <section className="space-y-4 rounded-lg bg-paper p-6 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-display text-xl font-semibold">How I read your business</h2>
        <span className={`rounded px-2 py-0.5 text-xs font-medium ${status.cls}`}>{status.label}</span>
        <span className="font-mono text-xs text-muted">confidence {Math.round(brief.confidence * 100)}%</span>
      </div>
      <p className="text-lg leading-snug">{brief.productSummary}</p>
      <p className="text-sm text-muted">{brief.statusReason}</p>

      <dl className="grid grid-cols-2 gap-4 border-t border-rule pt-4 text-sm sm:grid-cols-4">
        <Field label="Categories" value={brief.categories.join(", ")} />
        <Field label="Values" value={brief.values.join(", ")} />
        <Field label="Price" value={`${brief.priceTier}${brief.estPriceUsd != null ? ` · ~$${brief.estPriceUsd}` : ""}`} />
        <Field label="Buying model" value={brief.purchaseModel.replace("_", "-")} />
      </dl>

      {flags.length > 0 && (
        <ul className="space-y-1.5">
          {flags.map((f) => (
            <li key={f.code} className="rounded-md bg-warn-soft px-3 py-2 text-sm text-warn">{f.message}</li>
          ))}
        </ul>
      )}

      {brief.assumptions.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-muted">What I assumed ({brief.assumptions.length})</summary>
          <ul className="mt-2 ml-5 list-disc space-y-1">{brief.assumptions.map((a) => <li key={a}>{a}</li>)}</ul>
        </details>
      )}

      {brief.clarifyingQuestions.length > 0 && (
        <form
          className="space-y-3 rounded-md border border-rule p-4"
          onSubmit={(e) => {
            e.preventDefault();
            onAnswer(brief.clarifyingQuestions, answers);
          }}
        >
          <p className="text-sm font-medium">Answer these to sharpen the plan</p>
          {brief.clarifyingQuestions.map((q, i) => (
            <label key={q} className="block text-sm">
              {q}
              <input
                className="mt-1 w-full rounded-md border border-rule bg-paper px-2 py-1.5"
                value={answers[i] ?? ""}
                onChange={(e) => setAnswers((prev) => { const next = [...prev]; next[i] = e.target.value; return next; })}
              />
            </label>
          ))}
          <button type="submit" className="rounded-md bg-ink px-3 py-1.5 text-sm text-paper disabled:opacity-40" disabled={busy}>
            Re-plan with answers
          </button>
        </form>
      )}
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-muted">{label}</dt>
      <dd className="mt-0.5">{value || "–"}</dd>
    </div>
  );
}
