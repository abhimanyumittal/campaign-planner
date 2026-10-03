import type { Reason } from "@/lib/types";
import { clamp } from "@/lib/util";

type Seg = { left: number; width: number; kind: "pos" | "neg" | "review" | "reviewNeg"; label: string };

const KIND_CLASS: Record<Seg["kind"], string> = {
  pos: "bg-pos",
  neg: "hatch text-neg bg-neg-soft",
  review: "bg-review",
  reviewNeg: "hatch text-review bg-review-soft",
};

/**
 * The score drawn from its own reasons: green segments are rule points earned, crimson hatching is
 * what penalties took back, violet is the LLM reviewer's adjustment. The ink tick is the final score.
 */
export default function ScoreLedger({ reasons, adjustment, finalScore, threshold }: {
  reasons: Reason[];
  adjustment: number;
  finalScore: number;
  threshold: number;
}) {
  const segs: Seg[] = [];
  let x = 0;
  for (const r of reasons.filter((r) => r.points > 0)) {
    const width = Math.min(r.points, 100 - x);
    if (width > 0) segs.push({ left: x, width, kind: "pos", label: `+${r.points} ${r.label}` });
    x += r.points;
  }
  const posEnd = Math.min(x, 100);
  const ruleScore = clamp(x + reasons.filter((r) => r.points < 0).reduce((s, r) => s + r.points, 0), 0, 100);

  let cursor = posEnd;
  for (const r of reasons.filter((r) => r.points < 0)) {
    const width = Math.min(-r.points, cursor - ruleScore);
    if (width <= 0) continue;
    cursor -= width;
    segs.push({ left: cursor, width, kind: "neg", label: `${r.points} ${r.label}` });
  }

  if (adjustment > 0) {
    segs.push({ left: ruleScore, width: Math.min(adjustment, 100 - ruleScore), kind: "review", label: `+${adjustment} reviewer` });
  } else if (adjustment < 0) {
    segs.push({ left: finalScore, width: ruleScore - finalScore, kind: "reviewNeg", label: `${adjustment} reviewer` });
  }

  return (
    <div className="relative h-3 w-full rounded-sm bg-mist" role="img" aria-label={`Score ${finalScore} of 100; recommendation bar at ${threshold}`}>
      <div className="grow-in absolute inset-0">
        {segs.map((s, i) => (
          <span
            key={i}
            title={s.label}
            className={`absolute top-0 h-full border-r border-paper ${KIND_CLASS[s.kind]}`}
            style={{ left: `${s.left}%`, width: `${s.width}%`, opacity: s.kind === "pos" ? 1 - Math.min(i, 4) * 0.14 : 1 }}
          />
        ))}
      </div>
      <span className="absolute -top-1 h-5 w-px bg-muted/60" style={{ left: `${threshold}%` }} title={`Recommendation bar: ${threshold}`} />
      <span className="absolute -top-1.5 h-6 w-0.5 bg-ink" style={{ left: `calc(${finalScore}% - 1px)` }} title={`Final score ${finalScore}`} />
    </div>
  );
}
