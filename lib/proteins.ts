// hacksprout — alternative protein catalogue
// ---------------------------------------------------------------------------
// Nutrition values are traced to specific rows in FAO WAFCT 2019 or USDA
// FoodData Central SR Legacy (see `source` on each entry and DATA_SOURCES.md).
// Prices are traced to WFP/NBS/team price records, or explicitly labelled
// "derived" / "modelled" where no market series exists.
//
// IMPORTANT: the `functional` properties (solubility, water-holding,
// emulsification, gelation) are QUALITATIVE, literature-based descriptors of
// cooking behaviour — they are not lab measurements and must never be
// presented as measured values.
// ---------------------------------------------------------------------------

export type FunctionalLevel = "High" | "Moderate" | "Low";

export interface FunctionalProfile {
  solubility: FunctionalLevel;
  waterHolding: FunctionalLevel;
  emulsification: FunctionalLevel;
  gelation: FunctionalLevel;
}

export interface ProteinEntry {
  id: string;
  name: string;
  /** g protein per 100 g, from the row named in `source` (or the stated derivation). */
  proteinGPer100g: number;
  /** NGN per kg (per litre for soy milk, density ≈ 1 kg/L). */
  priceNgnPerKg: number;
  /** Where the price comes from; "derived"/"modelled" entries are flagged honestly. */
  priceBasis: string;
  allergens: string[];
  functional: FunctionalProfile;
  /** One sentence on how this protein behaves in a real kitchen. */
  kitchenMeaning: string;
  /** Dataset + food code/name behind the protein value. */
  source: string;
}

export const PROTEINS: ProteinEntry[] = [
  {
    id: "soy-chunks",
    name: "Soy chunks (TVP)",
    proteinGPer100g: 41.71,
    priceNgnPerKg: 8850,
    priceBasis:
      "Supermart.ng packaged retail — Nutrela 200 g pack = ₦1,770 (via team swap database); loose locally made chunks likely cheaper — verify at market",
    allergens: ["soy"],
    functional: {
      solubility: "Low",
      waterHolding: "High",
      emulsification: "Low",
      gelation: "Low",
    },
    kitchenMeaning:
      "Dry chunks absorb 2–3× their weight in seasoned water, then grill, fry or stew like meat — the kebab and shawarma workhorse.",
    source:
      "USDA FoodData Central SR Legacy — 'Meat extender' (FDC 174268), 41.71 g/100 g",
  },
  {
    id: "awara",
    name: "Awara (soy curd / tofu)",
    proteinGPer100g: 17.27,
    priceNgnPerKg: 450,
    priceBasis:
      "derived — modelled from soybean price (₦650/kg dry beans, team swap database market reports; ~2 kg fresh awara per kg of beans, plus a processing margin)",
    allergens: ["soy"],
    functional: {
      solubility: "Low",
      waterHolding: "Moderate",
      emulsification: "Low",
      gelation: "High",
    },
    kitchenMeaning:
      "Awara is itself a set protein gel: it slices, presses and holds its shape on the grill or in the fryer.",
    source:
      "USDA FoodData Central SR Legacy — 'Tofu, raw, firm, prepared with calcium sulfate' (FDC 172475), 17.27 g/100 g",
  },
  {
    id: "soy-milk",
    name: "Soy milk base",
    proteinGPer100g: 2.7,
    priceNgnPerKg: 900,
    priceBasis:
      "derived — modelled from soybean price (₦650/kg dry beans; ~6 L milk per kg of beans, plus fuel, sweetener and packaging) — weakest price in this set, verify before quoting",
    allergens: ["soy"],
    functional: {
      solubility: "High",
      waterHolding: "Moderate",
      emulsification: "High",
      gelation: "Low",
    },
    kitchenMeaning:
      "Emulsifies oil into a creamy sauce — the shawarma garlic-sauce base that replaces egg. (Water-holding is nominal: this is a liquid.)",
    source:
      "derived — modelled from WAFCT 2019 code 03_008 'Soya bean, dry, raw' (31.3 g/100 g): 100 g dry beans → ~750 g milk at ~65% protein recovery ≈ 2.7 g/100 g. No direct soy-milk row exists in WAFCT or the USDA extract.",
  },
  {
    id: "egusi",
    name: "Egusi (melon seed)",
    proteinGPer100g: 19.5,
    priceNgnPerKg: 1591,
    priceBasis:
      "derived — modelled proxy from WFP Groundnuts 2026 retail median (₦3,500 per 2.2 kg unit = ₦1,591/kg); egusi has no WFP or NBS price series — treat as a floor value and verify at market",
    allergens: [],
    functional: {
      solubility: "Moderate",
      waterHolding: "Moderate",
      emulsification: "High",
      gelation: "Moderate",
    },
    kitchenMeaning:
      "Ground egusi emulsifies and thickens the soup itself — the base carries protein, not just the pieces floating in it.",
    source:
      "WAFCT 2019 code 06_035 — 'Melon seed (citrullus spp.), kernel only, dried, raw', 19.5 g/100 g",
  },
  {
    id: "bambara",
    name: "Bambara groundnut",
    proteinGPer100g: 19.5,
    priceNgnPerKg: 960,
    priceBasis:
      "derived — modelled from WFP cowpea price (Cowpeas 2026 retail median ₦2,400 per 2.5 kg unit = ₦960/kg); bambara trades in the same legume band",
    allergens: [],
    functional: {
      solubility: "Moderate",
      waterHolding: "High",
      emulsification: "Moderate",
      gelation: "High",
    },
    kitchenMeaning:
      "Boils soft like beans and binds when mashed — it sets in okpa-style wraps and holds a pie filling together.",
    source:
      "WAFCT 2019 code 03_001 — 'Bambara groundnut, dry, raw', 19.5 g/100 g",
  },
  {
    id: "mushrooms",
    name: "Mushrooms",
    proteinGPer100g: 3.09,
    priceNgnPerKg: 4000,
    priceBasis:
      "Abuja-area farm price via team swap database (Daily Trust); urban retail range ₦2,500–6,000/kg",
    allergens: [],
    functional: {
      solubility: "Low",
      waterHolding: "Low",
      emulsification: "Low",
      gelation: "Low",
    },
    kitchenMeaning:
      "Flavour and chew, not structure or protein — pair with soy or beans for protein; mushrooms release water in the pan, so sear hot and dry.",
    source:
      "USDA FoodData Central SR Legacy — 'Mushroom, white, exposed to ultraviolet light, raw' (FDC 169376), 3.09 g/100 g. Abuja supply is mostly oyster mushroom; this is the closest mushroom row in the pack.",
  },
  {
    id: "dawadawa",
    name: "Dawadawa / soumbala (fermented locust bean)",
    proteinGPer100g: 33.1,
    priceNgnPerKg: 5000,
    priceBasis:
      "modelled estimate — no verified market series in the dataset pack (dawadawa is sold in small balls; this is a per-kg equivalent). Verify at market. Used at only 5–10 g per serving, so dish-cost impact is small",
    allergens: [],
    functional: {
      solubility: "Moderate",
      waterHolding: "Low",
      emulsification: "Low",
      gelation: "Low",
    },
    kitchenMeaning:
      "A fermented umami seasoning: crumble it into the base so plant dishes never taste empty — flavour first, the protein is a bonus.",
    source:
      "WAFCT 2019 code 03_042 — 'African locust bean, fermented (soumbala)', 33.1 g/100 g",
  },
  {
    id: "chicken",
    name: "Chicken (animal reference)",
    proteinGPer100g: 23.0,
    priceNgnPerKg: 7059,
    priceBasis:
      "Numbeo Abuja (Nov 2026) chicken fillets, via team swap database / price records",
    allergens: [],
    functional: {
      solubility: "Low",
      waterHolding: "Moderate",
      emulsification: "Moderate",
      gelation: "Moderate",
    },
    kitchenMeaning:
      "The benchmark: what kebab and shawarma protein costs and tastes like today — swaps are judged against it, never recommended as a plant option.",
    source:
      "WAFCT 2019 code 07_033 — 'Chicken, light meat without skin, raw', 23.0 g/100 g",
  },
  {
    id: "beef",
    name: "Beef (animal reference)",
    proteinGPer100g: 20.3,
    priceNgnPerKg: 6375,
    priceBasis:
      "WFP Nigeria 2026 retail median — computed from the pack file: ₦6,375.43/kg across 228 observations (unit KG)",
    allergens: [],
    functional: {
      solubility: "Low",
      waterHolding: "Moderate",
      emulsification: "Moderate",
      gelation: "Moderate",
    },
    kitchenMeaning:
      "The red-meat benchmark for cost and protein comparison — a reference, never a plant-based recommendation.",
    source:
      "WAFCT 2019 code 07_023 — 'Beef meat, ground, ca. 10% fat, raw', 20.3 g/100 g; price: WFP Food Prices for Nigeria, commodity 'Meat (beef)'",
  },
];
