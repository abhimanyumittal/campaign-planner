import type { Brief } from "@/lib/types";

export function makeBrief(o: Partial<Brief> = {}): Brief {
  return {
    status: "clear", statusReason: "", productSummary: "test product",
    categories: [], values: [], priceTier: "unknown", estPriceUsd: null,
    targetGender: "any", targetAgeMin: null, targetAgeMax: null,
    purchaseModel: "unknown", confidence: 0.9, assumptions: [], clarifyingQuestions: [],
    ...o,
  };
}

export const DOG_FOOD = makeBrief({
  categories: ["pet_food", "pet_health"], values: ["premium_quality", "health_conscious"],
  priceTier: "premium", estPriceUsd: 70, purchaseModel: "subscription",
});
export const HANDBAG = makeBrief({
  categories: ["luxury_accessories"], values: ["heritage_craft", "premium_quality"],
  priceTier: "luxury", estPriceUsd: 1200, targetGender: "female", purchaseModel: "one_time",
});
export const DENTAL = makeBrief({ status: "no_fit", categories: ["b2b_software"], purchaseModel: "b2b" });
export const CANDLES = makeBrief({
  categories: ["home_decor_candles"], values: ["giftable", "sustainability", "heritage_craft"],
  priceTier: "mid", estPriceUsd: 35, purchaseModel: "one_time",
});
export const CLEANING = makeBrief({
  categories: ["household_cleaning"], values: ["sustainability"],
  priceTier: "mid", estPriceUsd: 30, purchaseModel: "subscription",
});
export const ACTIVEWEAR = makeBrief({
  categories: ["activewear", "womens_apparel"], values: ["sustainability"],
  priceTier: "premium", estPriceUsd: 90, targetGender: "female", purchaseModel: "one_time",
});
