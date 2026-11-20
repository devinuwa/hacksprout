// hacksprout — dish ingredients
// ---------------------------------------------------------------------------
// The ~15 ingredients needed to compose the Veggie Victory style dishes the
// app redesigns: jollof, egusi soup, efo riro, kebab skewers and shawarma.
// Every protein value is read from FAO WAFCT 2019 (sheet "03 NV_sum_39
// (per 100g EP)") — see `source` for the exact code and food name, and
// DATA_SOURCES.md for the verification log.
// ---------------------------------------------------------------------------

export interface DishIngredient {
  id: string;
  name: string;
  /** g protein per 100 g edible portion. */
  proteinGPer100g: number;
  /** Dataset + food code/name behind the value. */
  source: string;
  allergens?: string[];
}

export const INGREDIENTS: DishIngredient[] = [
  {
    id: "rice",
    name: "Rice, white, raw",
    proteinGPer100g: 7.0,
    source: "WAFCT 2019 code 01_037 — 'Rice, white, raw'",
  },
  {
    id: "tomato",
    name: "Tomato, fresh",
    proteinGPer100g: 1.1,
    source: "WAFCT 2019 code 04_021 — 'Tomato, red, ripe, raw'",
  },
  {
    id: "tomato-paste",
    name: "Tomato paste",
    proteinGPer100g: 3.2,
    source: "WAFCT 2019 code 04_066 — 'Tomato, paste, concentrated, without salt'",
  },
  {
    id: "sweet-pepper",
    name: "Sweet pepper (red)",
    proteinGPer100g: 2.0,
    source: "WAFCT 2019 code 04_047 — 'Pepper, sweet, red, fresh, raw'",
  },
  {
    id: "chilli-pepper",
    name: "Chilli pepper, fresh",
    proteinGPer100g: 1.8,
    source: "WAFCT 2019 code 04_046 — 'Pepper, chilli, fresh, raw'",
  },
  {
    id: "onion",
    name: "Onion, fresh",
    proteinGPer100g: 1.1,
    source: "WAFCT 2019 code 04_018 — 'Onion, fresh, raw'",
  },
  {
    id: "palm-oil",
    name: "Palm oil, red",
    proteinGPer100g: 0,
    source: "WAFCT 2019 code 11_004 — 'Palm oil, red'",
  },
  {
    id: "vegetable-oil",
    name: "Vegetable oil (refined)",
    proteinGPer100g: 0,
    source:
      "WAFCT 2019 code 11_007 — 'Palm oil, refined and decoloured, unfortified' (Nigerian retail 'vegetable oil' is refined palm olein)",
  },
  {
    id: "amaranth-greens",
    name: "Leafy greens (amaranth leaves / efo)",
    proteinGPer100g: 4.1,
    source: "WAFCT 2019 code 04_023 — 'Amaranth, leaves, fresh, raw'",
  },
  {
    id: "wheat-flour",
    name: "Wheat flour, white",
    proteinGPer100g: 10.4,
    source: "WAFCT 2019 code 01_043 — 'Wheat flour, white, unfortified'",
    allergens: ["wheat", "gluten"],
  },
  {
    id: "cabbage",
    name: "Cabbage, white",
    proteinGPer100g: 1.6,
    source: "WAFCT 2019 code 04_005 — 'Cabbage, white, raw'",
  },
  {
    id: "carrot",
    name: "Carrot",
    proteinGPer100g: 0.9,
    source: "WAFCT 2019 code 04_006 — 'Carrot, raw'",
  },
  {
    id: "garlic",
    name: "Garlic",
    proteinGPer100g: 6.5,
    source: "WAFCT 2019 code 04_015 — 'Garlic, flesh, raw'",
  },
  {
    id: "ginger",
    name: "Ginger, fresh root",
    proteinGPer100g: 2.2,
    source: "WAFCT 2019 code 04_082 — 'Ginger, root, raw'",
  },
  {
    id: "groundnut",
    name: "Groundnut (peanut) — kebab yaji base",
    proteinGPer100g: 22.4,
    source: "WAFCT 2019 code 06_010 — 'Groundnut, shelled, dried, raw'",
    allergens: ["peanut"],
  },
];
