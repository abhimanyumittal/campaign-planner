import type { Reason } from "@/lib/types";

export default function ReasonChips({ reasons }: { reasons: Reason[] }) {
  if (!reasons.length) return null;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {reasons.map((r) => (
        <li
          key={r.label}
          className={`rounded px-1.5 py-0.5 text-xs ${r.points >= 0 ? "bg-pos-soft text-pos" : "bg-neg-soft text-neg"}`}
        >
          <span className="font-mono">{r.points >= 0 ? "+" : "−"}{Math.abs(r.points)}</span> {r.label}
        </li>
      ))}
    </ul>
  );
}
