// Shared vocabulary. Publishers and personas are tagged into it once (in a real system this
// happens at publisher onboarding, likely LLM-assisted and human-reviewed). At request time the
// LLM maps the advertiser's free text into the same vocabulary, which makes everything comparable.

export const CATEGORIES = [
  "pet_food", "pet_supplies", "pet_health", "pet_toys_treats",
  "activewear", "womens_apparel", "classic_apparel", "plus_size_apparel", "basics_socks_underwear",
  "footwear", "luxury_accessories", "outdoor_gear",
  "beauty_skincare", "haircare",
  "supplements_vitamins", "fitness_services", "spa_selfcare",
  "functional_beverages", "alcohol",
  "organic_grocery", "grocery_convenience", "meal_kits", "gourmet_food",
  "household_cleaning", "bedding_bath", "kitchen_cookware", "home_decor_candles",
  "kids_family", "subscription_box", "travel", "b2b_software",
] as const;
export type Category = (typeof CATEGORIES)[number];

// Umbrella categories that many publishers carry. Matching only on one of these is weak evidence
// ("sells women's clothing" says little about fit for sustainable activewear), so it scores lower.
export const BROAD_CATEGORIES: readonly Category[] = ["womens_apparel"];

export const VALUES = [
  "sustainability", "science_backed", "premium_quality", "value_price", "convenience",
  "giftable", "playful_aesthetic", "heritage_craft", "performance", "inclusive",
  "social_good", "health_conscious",
] as const;
export type Value = (typeof VALUES)[number];

export type PublisherProfile = { categories: Category[]; values: Value[]; subscription: boolean };
export type PersonaProfile = {
  categories: Category[];
  values: Value[];
  antiValues: Value[];
  avoidsSubscription?: boolean;
};

export const PUBLISHER_PROFILES: Record<string, PublisherProfile> = {
  pub_001: { categories: ["grocery_convenience", "alcohol", "household_cleaning"], values: ["convenience"], subscription: false }, // Swiftcart
  pub_002: { categories: ["activewear", "womens_apparel"], values: ["performance", "health_conscious"], subscription: true }, // Movewell
  pub_003: { categories: ["fitness_services", "spa_selfcare"], values: ["health_conscious", "premium_quality"], subscription: false }, // Studiogrid
  pub_004: { categories: ["womens_apparel", "classic_apparel"], values: ["premium_quality"], subscription: false }, // Marlowe & Co.
  pub_005: { categories: ["womens_apparel", "classic_apparel"], values: ["premium_quality", "heritage_craft"], subscription: false }, // Linden Park
  pub_006: { categories: ["womens_apparel", "plus_size_apparel", "basics_socks_underwear"], values: ["inclusive"], subscription: false }, // Everbody
  pub_007: { categories: ["pet_food", "pet_supplies"], values: ["premium_quality", "health_conscious"], subscription: true }, // Pawline
  pub_008: { categories: ["organic_grocery", "gourmet_food", "household_cleaning"], values: ["sustainability", "health_conscious"], subscription: true }, // Pantrygood
  pub_009: { categories: ["pet_food", "pet_supplies", "pet_health"], values: [], subscription: false }, // Ruffco
  pub_010: { categories: ["basics_socks_underwear"], values: ["giftable", "social_good"], subscription: false }, // Heartfoot
  pub_011: { categories: ["bedding_bath", "home_decor_candles"], values: ["premium_quality"], subscription: false }, // Northbed
  pub_012: { categories: ["supplements_vitamins"], values: ["science_backed", "health_conscious"], subscription: true }, // Daily Form
  pub_013: { categories: ["beauty_skincare"], values: ["playful_aesthetic"], subscription: false }, // Velvetline
  pub_014: { categories: ["kitchen_cookware"], values: ["sustainability", "giftable", "premium_quality"], subscription: false }, // Hearthstone Goods
  pub_015: { categories: ["meal_kits", "grocery_convenience"], values: ["convenience"], subscription: true }, // Kitchenly
  pub_016: { categories: ["footwear", "womens_apparel"], values: ["sustainability"], subscription: false }, // Stride & Stem
  pub_017: { categories: ["footwear", "activewear"], values: ["sustainability", "performance"], subscription: false }, // Cloudfoot
  pub_018: { categories: ["pet_supplies", "pet_toys_treats", "subscription_box"], values: ["playful_aesthetic"], subscription: true }, // Tailcrate
  pub_019: { categories: ["haircare", "beauty_skincare"], values: [], subscription: false }, // Strandlab
  pub_020: { categories: ["functional_beverages"], values: ["health_conscious", "playful_aesthetic"], subscription: false }, // Pop & Sip
};

export const PERSONA_PROFILES: Record<string, PersonaProfile> = {
  persona_001: { categories: ["supplements_vitamins", "fitness_services", "beauty_skincare", "organic_grocery", "activewear"], values: ["science_backed", "health_conscious"], antiValues: [] }, // Wellness Optimizer
  persona_002: { categories: ["meal_kits", "household_cleaning", "kids_family", "pet_food", "grocery_convenience"], values: ["convenience"], antiValues: [] }, // Busy Parent
  persona_003: { categories: ["beauty_skincare", "womens_apparel", "functional_beverages", "home_decor_candles"], values: ["playful_aesthetic", "social_good", "sustainability"], antiValues: [] }, // Gen Z Aesthete
  persona_004: { categories: ["pet_food", "pet_supplies", "pet_health", "pet_toys_treats", "subscription_box"], values: ["premium_quality", "health_conscious"], antiValues: ["value_price"] }, // Pet Parent
  persona_005: { categories: ["classic_apparel", "womens_apparel", "bedding_bath", "kitchen_cookware", "home_decor_candles", "travel", "gourmet_food", "luxury_accessories"], values: ["premium_quality", "heritage_craft"], antiValues: ["playful_aesthetic"] }, // Affluent Classic
  persona_006: { categories: ["organic_grocery", "beauty_skincare", "household_cleaning", "bedding_bath", "kitchen_cookware", "footwear"], values: ["sustainability"], antiValues: [] }, // Sustainability Buyer
  persona_007: { categories: ["grocery_convenience", "meal_kits", "subscription_box"], values: ["convenience"], antiValues: [] }, // Convenience-First Millennial
  persona_008: { categories: ["womens_apparel", "household_cleaning", "grocery_convenience", "kids_family"], values: ["value_price"], antiValues: [] }, // Value-Conscious Shopper
  persona_009: { categories: ["activewear", "supplements_vitamins", "fitness_services", "functional_beverages", "footwear"], values: ["performance", "health_conscious"], antiValues: [] }, // Fitness Enthusiast
  persona_010: { categories: ["basics_socks_underwear", "home_decor_candles", "beauty_skincare", "gourmet_food", "kitchen_cookware", "bedding_bath", "luxury_accessories"], values: ["giftable", "premium_quality"], antiValues: [], avoidsSubscription: true }, // Gifter
};
