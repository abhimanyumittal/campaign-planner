import { publisherById } from "@/lib/catalog";
import type { PlanResult } from "@/lib/types";
import ReasonChips from "./ReasonChips";

export default function PersonaSection({ plan }: { plan: PlanResult }) {
  const selected = plan.personas.filter((m) => m.selected);
  const others = plan.personas.filter((m) => !m.selected);
  if (!selected.length) return null;
  return (
    <section className="space-y-4">
      <h2 className="font-display text-2xl font-semibold">Who to talk to, and what to say</h2>
      <div className="grid gap-4 xl:grid-cols-2">
        {selected.map((m) => {
          const ad = plan.creatives.find((v) => v.personaId === m.persona.id);
          const pub = ad?.bestPublisherId ? publisherById(ad.bestPublisherId) : null;
          return (
            <article key={m.persona.id} className="flex flex-col gap-4 rounded-lg bg-paper p-5 shadow-sm">
              <header className="space-y-1">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-display text-lg font-semibold">{m.persona.name}</h3>
                  <span className="font-mono text-xs text-muted">
                    {m.score}/100{m.stretch && <span className="ml-1 rounded bg-warn-soft px-1 text-warn">weak match</span>}
                  </span>
                </div>
                <p className="text-xs text-muted">{m.persona.age_range} · {m.persona.gender_skew} · price sensitivity {m.persona.price_sensitivity}</p>
              </header>
              {ad && <p className="text-sm">{ad.whyThisPersona}</p>}
              <ReasonChips reasons={m.reasons} />
              {ad ? (
                <figure className="mt-auto rounded-md border border-rule p-4">
                  <figcaption className="mb-2 flex justify-between text-[11px] uppercase tracking-wider text-muted">
                    <span>{ad.angle}</span>
                    {pub && <span>on {pub.name}</span>}
                  </figcaption>
                  <p className="font-display text-lg font-semibold leading-tight">{ad.headline}</p>
                  <p className="mt-1 text-sm">{ad.body}</p>
                  <span className="mt-3 inline-block rounded bg-ink px-2.5 py-1 text-xs font-medium text-paper">{ad.cta}</span>
                </figure>
              ) : (
                <p className="mt-auto text-sm text-muted">No ad was written for this persona.</p>
              )}
            </article>
          );
        })}
      </div>
      <details className="rounded-lg bg-paper p-5 shadow-sm">
        <summary className="cursor-pointer font-medium">Shopper types not targeted ({others.length})</summary>
        <ul className="mt-3 divide-y divide-rule text-sm">
          {others.map((m) => {
            const worst = [...m.reasons].sort((a, b) => a.points - b.points)[0];
            const why = worst && worst.points < 0 ? worst.label : m.reasons.length ? "Too little overlap" : "No overlap with this product";
            return (
              <li key={m.persona.id} className="grid gap-1 py-2 sm:grid-cols-[220px_48px_1fr] sm:gap-4">
                <span className="font-medium">{m.persona.name}</span>
                <span className="font-mono text-muted">{m.score}</span>
                <span className="text-muted">{why}</span>
              </li>
            );
          })}
        </ul>
      </details>
    </section>
  );
}
