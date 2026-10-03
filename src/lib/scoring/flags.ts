import { PUBLISHERS } from "../catalog";
import type { Brief, Flag, PublisherMatch } from "../types";

const MAX_AOV = Math.max(...PUBLISHERS.map((p) => p.avg_order_value_usd));
const CARRIED = new Set<string>(PUBLISHERS.flatMap((p) => p.profile.categories));

export function computeFlags(brief: Brief, publishers: PublisherMatch[]): Flag[] {
  const flags: Flag[] = [];
  if (brief.status === "vague") {
    flags.push({ code: "vague_input", message: "Low-signal description. This is a best guess; answer the questions to sharpen it." });
  }
  if (brief.status === "no_fit") {
    flags.push({ code: "no_fit", message: `Outside this catalog: ${brief.statusReason}` });
  }
  if (brief.estPriceUsd != null && brief.estPriceUsd > 3 * MAX_AOV) {
    flags.push({
      code: "price_above_catalog",
      message: `Your ~$${brief.estPriceUsd} price is far above every publisher's typical order (max $${MAX_AOV}). Expect low conversion; consider awareness goals.`,
    });
  }
  const uncovered = brief.categories.filter((c) => !CARRIED.has(c));
  if (brief.categories.length && uncovered.length === brief.categories.length) {
    flags.push({ code: "no_category_coverage", message: `No publisher in the catalog sells ${uncovered.join(", ")}.` });
  }
  const included = publishers.filter((p) => p.included).length;
  if (brief.status !== "no_fit" && included < 2) {
    flags.push({ code: "few_matches", message: `Only ${included} publisher(s) cleared the bar. See "Not recommended" for the closest options.` });
  }
  return flags;
}
