// hacksprout — dish ingredients
// ---------------------------------------------------------------------------
// The ~15 ingredients needed to compose the Veggie Victory style dishes the
// app redesigns: jollof, egusi soup, efo riro, kebab skewers and shawarma.
// Every protein value is read from FAO WAFCT 2019 (sheet "03 NV_sum_39
// (per 100g EP)"); exact codes: rice 01_037, tomato 04_021, tomato paste
// 04_066, sweet pepper 04_047, chilli pepper 04_046, onion 04_018, palm oil
// (red) 11_004, palm oil (refined) 11_007, amaranth leaves 04_023, wheat
// flour 01_043, cabbage 04_005, carrot 04_006, garlic 04_015, ginger 04_082,
// groundnut 06_010. See DATA_SOURCES.md for the verification log. The runtime
// `source` strings below are UI-safe descriptors (the UI never names its
// data sources).
// ---------------------------------------------------------------------------

export interface DishIngredient {
  id: string;
  name: string;
  /** g protein per 100 g edible portion. */
  proteinGPer100g: number;
  /** UI-safe descriptor of the composition entry behind the value (codes live in the header comment). */
  source: string;
  allergens?: string[];
}

export const INGREDIENTS: DishIngredient[] = [
  {
    id: "rice",
    name: "Rice, white, raw",
    proteinGPer100g: 7.0,
    source: "Standard food-composition tables — rice, white, raw",
  },
  {
    id: "tomato",
    name: "Tomato, fresh",
    proteinGPer100g: 1.1,
    source: "Standard food-composition tables — tomato, red, ripe, raw",
  },
  {
    id: "tomato-paste",
    name: "Tomato paste",
    proteinGPer100g: 3.2,
    source: "Standard food-composition tables — tomato paste, concentrated, without salt",
  },
  {
    id: "sweet-pepper",
    name: "Sweet pepper (red)",
    proteinGPer100g: 2.0,
    source: "Standard food-composition tables — sweet pepper, red, fresh",
  },
  {
    id: "chilli-pepper",
    name: "Chilli pepper, fresh",
    proteinGPer100g: 1.8,
    source: "Standard food-composition tables — chilli pepper, fresh",
  },
  {
    id: "onion",
    name: "Onion, fresh",
    proteinGPer100g: 1.1,
    source: "Standard food-composition tables — onion, fresh",
  },
  {
    id: "palm-oil",
    name: "Palm oil, red",
    proteinGPer100g: 0,
    source: "Standard food-composition tables — palm oil, red",
  },
  {
    id: "vegetable-oil",
    name: "Vegetable oil (refined)",
    proteinGPer100g: 0,
    source:
      "Standard food-composition tables — palm oil, refined and decoloured, unfortified (Nigerian retail 'vegetable oil' is refined palm olein)",
  },
  {
    id: "amaranth-greens",
    name: "Leafy greens (amaranth leaves / efo)",
    proteinGPer100g: 4.1,
    source: "Standard food-composition tables — amaranth leaves, fresh",
  },
  {
    id: "wheat-flour",
    name: "Wheat flour, white",
    proteinGPer100g: 10.4,
    source: "Standard food-composition tables — wheat flour, white, unfortified",
    allergens: ["wheat", "gluten"],
  },
  {
    id: "cabbage",
    name: "Cabbage, white",
    proteinGPer100g: 1.6,
    source: "Standard food-composition tables — cabbage, white",
  },
  {
    id: "carrot",
    name: "Carrot",
    proteinGPer100g: 0.9,
    source: "Standard food-composition tables — carrot",
  },
  {
    id: "garlic",
    name: "Garlic",
    proteinGPer100g: 6.5,
    source: "Standard food-composition tables — garlic",
  },
  {
    id: "ginger",
    name: "Ginger, fresh root",
    proteinGPer100g: 2.2,
    source: "Standard food-composition tables — ginger root",
  },
  {
    id: "groundnut",
    name: "Groundnut (peanut) — kebab yaji base",
    proteinGPer100g: 22.4,
    source: "Standard food-composition tables — groundnut, shelled, dried",
    allergens: ["peanut"],
  },
];
