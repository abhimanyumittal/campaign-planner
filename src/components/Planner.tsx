"use client";

import { useState } from "react";
import type { Example } from "@/lib/examples";
import type { PlanResult } from "@/lib/types";
import type { BaselineResult } from "@/lib/baseline";
import BriefCard from "./BriefCard";
import PublisherSection from "./PublisherSection";
import PersonaSection from "./PersonaSection";
import ConfigSection from "./ConfigSection";
import BaselineSection from "./BaselineSection";

type Precomputed = { plan: PlanResult; baseline: BaselineResult | null };

// On narrow screens the results sit below the sample list, so bring them into view.
function revealResults() {
  if (window.innerWidth >= 1024) return;
  requestAnimationFrame(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }));
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data as T;
}

export default function Planner({ examples }: { examples: Example[] }) {
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [plan, setPlan] = useState<PlanResult | null>(null);
  const [baseline, setBaseline] = useState<BaselineResult | null>(null);
  const [cachedBaseline, setCachedBaseline] = useState<BaselineResult | null>(null);
  const [loading, setLoading] = useState<"plan" | "baseline" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeExample, setActiveExample] = useState<number | null>(null);

  const budgetUsd = budget ? Number(budget) : undefined;

  async function runLive(text: string) {
    setLoading("plan");
    setError(null);
    setBaseline(null);
    setCachedBaseline(null);
    revealResults();
    try {
      setPlan(await postJson<PlanResult>("/api/plan", { description: text, budgetUsd }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(null);
    }
  }

  async function pickExample(ex: Example) {
    setDescription(ex.text);
    setBudget("");
    setBaseline(null);
    setError(null);
    setActiveExample(ex.n);
    const res = await fetch(`/precomputed/example-${ex.n}.json`);
    if (res.ok) {
      const data = (await res.json()) as Precomputed;
      setPlan(data.plan);
      setCachedBaseline(data.baseline);
      revealResults();
    } else {
      await runLive(ex.text);
    }
  }

  async function compare() {
    if (cachedBaseline) return setBaseline(cachedBaseline);
    setLoading("baseline");
    setError(null);
    try {
      setBaseline(await postJson<BaselineResult>("/api/baseline", { description, budgetUsd }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(null);
    }
  }

  function answerQuestions(questions: string[], answers: string[]) {
    const extra = questions.map((q, i) => (answers[i]?.trim() ? `- ${q} ${answers[i].trim()}` : null)).filter(Boolean);
    if (!extra.length) return;
    const next = `${description}\n\nMore detail:\n${extra.join("\n")}`.slice(0, 600);
    setDescription(next);
    setActiveExample(null);
    void runLive(next);
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 lg:grid-cols-[360px_1fr] lg:px-8">
      <aside className="space-y-6 lg:sticky lg:top-8 lg:h-[calc(100vh-4rem)] lg:overflow-y-auto lg:pr-2">
        <header className="space-y-1">
          <h1 className="font-display text-3xl font-semibold tracking-tight">Campaign Planner</h1>
          <p className="text-sm text-muted">Describe what you sell. Get publishers, ads for each likely buyer, and a campaign config, with the reasoning shown.</p>
        </header>

        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            setActiveExample(null);
            void runLive(description);
          }}
        >
          <label className="block text-sm font-medium" htmlFor="description">Your business</label>
          <textarea
            id="description"
            className="w-full rounded-md border border-rule bg-paper p-3 text-sm"
            rows={5}
            maxLength={600}
            placeholder="We sell premium dog food for senior dogs, for owners who care about joint health."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="flex items-end gap-3">
            <label className="flex-1 text-sm font-medium">
              Budget for 30 days <span className="font-normal text-muted">(optional)</span>
              <div className="mt-1 flex items-center rounded-md border border-rule bg-paper px-2">
                <span className="font-mono text-sm text-muted">$</span>
                <input
                  className="w-full bg-transparent px-1 py-2 font-mono text-sm outline-none"
                  type="number" min={500} placeholder="10000"
                  value={budget} onChange={(e) => setBudget(e.target.value)}
                />
              </div>
            </label>
            <button
              type="submit"
              className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper disabled:opacity-40"
              disabled={!description.trim() || loading !== null}
            >
              {loading === "plan" ? "Planning…" : "Plan campaign"}
            </button>
          </div>
          {error && <p className="rounded-md bg-neg-soft p-3 text-sm text-neg">{error}</p>}
        </form>

        <section className="space-y-2">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted">Sample advertisers</h2>
          <ul className="divide-y divide-rule rounded-md border border-rule bg-paper">
            {examples.map((ex) => (
              <li key={ex.n}>
                <button
                  onClick={() => pickExample(ex)}
                  className={`flex w-full gap-3 px-3 py-2 text-left text-sm hover:bg-mist ${activeExample === ex.n ? "bg-mist" : ""}`}
                >
                  <span className="w-5 shrink-0 font-mono text-xs leading-5 text-muted">{ex.n}</span>
                  <span className="line-clamp-2">{ex.text}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </aside>

      <main id="results" className="min-w-0 scroll-mt-4 space-y-10 pb-16">
        {loading === "plan" && (
          <p className="rounded-md border border-rule bg-paper p-4 text-sm text-muted">
            Reading the brief, scoring 10 personas and 20 publishers, then reviewing the ranking and writing ads. Takes about 15 seconds.
          </p>
        )}
        {!plan && loading !== "plan" && <EmptyState />}
        {plan && loading !== "plan" && (
          <>
            <BriefCard key={plan.generatedAt} plan={plan} onAnswer={answerQuestions} busy={loading !== null} />
            <PublisherSection plan={plan} />
            <PersonaSection plan={plan} />
            <ConfigSection plan={plan} />
            <BaselineSection plan={plan} baseline={baseline} loading={loading === "baseline"} onCompare={compare} />
            <footer className="font-mono text-xs text-muted">
              {Object.entries(plan.timingsMs).map(([k, v]) => `${k} ${(v / 1000).toFixed(1)}s`).join(" · ")}
              {plan.warnings.length > 0 && <p className="mt-1">Notes: {plan.warnings.join("; ")}</p>}
            </footer>
          </>
        )}
      </main>
    </div>
  );
}

function EmptyState() {
  return (
    <section className="rounded-lg border border-dashed border-rule p-8">
      <h2 className="font-display text-xl font-semibold">Start with a sentence about your business, or pick a sample.</h2>
      <dl className="mt-6 grid gap-6 text-sm sm:grid-cols-3">
        <div><dt className="font-medium">Where to advertise</dt><dd className="text-muted">Publishers ranked by fit, plus why the rest were left out.</dd></div>
        <div><dt className="font-medium">Who to talk to</dt><dd className="text-muted">The shopper types most likely to buy, with an ad written for each.</dd></div>
        <div><dt className="font-medium">How to run it</dt><dd className="text-muted">Budget split, bids, targeting and the assumptions behind them.</dd></div>
      </dl>
    </section>
  );
}
