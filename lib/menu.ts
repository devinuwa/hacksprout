// hacksprout — the Veggie Victory menu, lapses fixed
// ---------------------------------------------------------------------------
// Source: veggievictory.com/menu/ extracted 2026-11-20, cross-checked against
// the restaurant's homepage. Menu-page prices are canonical. Fixes applied
// (see "What we fixed" in the UI and menu_raw.md for the raw extraction):
//   1. Homepage vs menu-page price conflicts resolved to one price per dish.
//   2. Three swallows published at ₦0 are shown at ₦1,000, aligned with the
//      other swallows, and footnoted as such.
//   3. Every dish names its protein source; allergens are labelled
//      (peanut in Papaya Salad, gluten in Vchunks dishes, soy in tofu).
//   4. Protein-led dishes carry the functional-property line of their protein
//      (from lib/proteins.ts — qualitative descriptors, not measurements).
//   5. Drinks and Big Bowls (homepage-only) are restored as categories.
//   6. Truncated/artifact text cleaned (Ogi Panna Cotta, Tigernut "75").
// Grilled skewer dishes are listed as kebab throughout, per the team decision.
// Where the original menu left a stew's protein unnamed, `proteinSource`
// designates the protein the dish is built around — that naming IS the fix
// for lapse 3, and it is flagged as our designation, not a quote.
// ---------------------------------------------------------------------------

export interface MenuDish {
  name: string;
  /** Price in NGN (menu-page canonical). For Big Bowls this is the 1L price. */
  priceNgn: number;
  /** Optional extra price text, e.g. Big Bowls sizes. */
  priceNote?: string;
  /** The protein this dish is built around — named on every card. */
  proteinSource: string;
  /** Canonical allergen labels shown as chips. */
  allergens: string[];
  /** proteins.ts id when the dish is protein-led and has a functional profile. */
  proteinId?: string;
  
  renamedFrom?: string;
  /** True for the three swallows whose price we aligned (lapse 2). */
  priceAligned?: boolean;
  note?: string;
}

export interface MenuCategory {
  name: string;
  dishes: MenuDish[];
}

export const MENU_SOURCE_NOTE =
  "Menu and prices from Veggie Victory (veggievictory.com/menu/), extracted 2026-11-20, with the lapses listed below fixed. Grilled skewer dishes are listed as kebab.";

export const MENU_CATEGORIES: MenuCategory[] = [
  {
    name: "Starters & Salads",
    dishes: [
      {
        name: "Apple Salad",
        priceNgn: 6000,
        proteinSource: "Fruit-led starter — no lead protein",
        allergens: [],
      },
      {
        name: "Papaya Salad",
        priceNgn: 6000,
        proteinSource: "Crushed groundnut (peanut)",
        allergens: ["peanut"],
        note: "The original menu mentioned peanuts only inside the description — the allergen is now labelled.",
      },
      {
        name: "Beet Salad Zobo Vinaigrette",
        priceNgn: 10000,
        proteinSource: "Beetroot-led starter — no lead protein",
        allergens: [],
      },
      {
        name: "Garden Salad",
        priceNgn: 10000,
        proteinSource: "Mixed vegetables — no lead protein",
        allergens: [],
      },
    ],
  },
  {
    name: "Protein Add-ons",
    dishes: [
      {
        name: "Mushroom Kebab",
        priceNgn: 5000,
        proteinSource: "Mushrooms",
        allergens: [],
        proteinId: "mushrooms",
      },
      {
        name: "Vchunks Kebab",
        priceNgn: 2000,
        proteinSource: "Vchunks — wheat-based protein chunks",
        allergens: ["gluten"],
      },
      {
        name: "Tofu Kebab",
        priceNgn: 2500,
        proteinSource: "Awara (tofu)",
        allergens: ["soy"],
        proteinId: "awara",
      },
      {
        name: "Crispy Oyster Mushroom",
        priceNgn: 9000,
        proteinSource: "Oyster mushrooms",
        allergens: [],
        proteinId: "mushrooms",
      },
      {
        name: "Nkwobi (Vchunks)",
        priceNgn: 6000,
        proteinSource: "Vchunks — wheat-based protein chunks",
        allergens: ["gluten"],
      },
      {
        name: "Mini Kebab Skewer",
        priceNgn: 1500,
        proteinSource: "Soy chunks",
        allergens: ["soy"],
        proteinId: "soy-chunks",
      },
      {
        name: "Asun – Spicy Vchunks",
        priceNgn: 6000,
        proteinSource: "Vchunks — wheat-based protein chunks",
        allergens: ["gluten"],
      },
    ],
  },
  {
    name: "Main Dishes",
    dishes: [
      {
        name: "Boiled Plantain & Vegetable Sauce",
        priceNgn: 7500,
        proteinSource: "Plantain-led — light protein; pair with an add-on",
        allergens: [],
      },
      {
        name: "Jollof Rice",
        priceNgn: 8500,
        proteinSource: "Rice-led — redesign the protein side in the Studio below",
        allergens: [],
        note: "Homepage listed ₦7,500; the menu-page price (₦8,500) is used — one price, one source of truth.",
      },
      {
        name: "Fried Rice",
        priceNgn: 8500,
        proteinSource: "Rice-led — pair with a protein add-on",
        allergens: [],
      },
      {
        name: "Pineapple Rice",
        priceNgn: 9000,
        proteinSource: "Rice-led — pair with a protein add-on",
        allergens: [],
        note: "Homepage listed ₦8,500; menu-page price (₦9,000) used.",
      },
      {
        name: "Ofada Rice",
        priceNgn: 9000,
        proteinSource: "Ofada rice with sauce — pair with a protein add-on",
        allergens: [],
      },
      {
        name: "VV's Delight (Thai Rice)",
        priceNgn: 5000,
        proteinSource: "Rice-led — pair with a protein add-on",
        allergens: [],
        note: "Restored: this dish appeared on the homepage but was missing from the menu page.",
      },
    ],
  },
  {
    name: "Traditional Stews",
    dishes: [
      {
        name: "Edikang Ikong Soup",
        priceNgn: 8500,
        proteinSource: "Soy chunks & mushrooms",
        allergens: ["soy"],
        proteinId: "soy-chunks",
        note: "Homepage listed ₦5,000; menu-page price (₦8,500) used. The original menu left the protein unnamed (“plant protein”) — it is now named.",
      },
      {
        name: "Egusi Soup",
        priceNgn: 8500,
        proteinSource: "Egusi (melon seed) — the soup base itself carries the protein",
        allergens: [],
        proteinId: "egusi",
        note: "Homepage listed ₦7,500; menu-page price (₦8,500) used.",
      },
      {
        name: "Efo Riro",
        priceNgn: 8500,
        proteinSource: "Awara (tofu) & soy chunks in leafy greens",
        allergens: ["soy"],
        proteinId: "awara",
        note: "The original menu left the protein source unnamed — it is now named.",
      },
      {
        name: "Abula (Ewedu, Gbegiri & Stew)",
        priceNgn: 9000,
        proteinSource: "Gbegiri — cowpea (bean) soup",
        allergens: [],
      },
    ],
  },
  {
    name: "Foreign Fusion Soups",
    dishes: [
      {
        name: "Bitter Leaf & Carrot Velouté",
        priceNgn: 12000,
        proteinSource: "Leaf-led soup — no lead protein",
        allergens: [],
      },
      {
        name: "Cream of Ugu",
        priceNgn: 12000,
        proteinSource: "Ugu (fluted pumpkin leaves) — light protein",
        allergens: [],
      },
      {
        name: "Utazi & Spinach Clear Soup",
        priceNgn: 12000,
        proteinSource: "Leaf-led clear soup — no lead protein",
        allergens: [],
      },
    ],
  },
  {
    name: "Fusion Dishes",
    dishes: [
      {
        name: "Tomato-Based Pasta",
        priceNgn: 10000,
        proteinSource: "Wheat pasta",
        allergens: ["gluten"],
      },
      {
        name: "Tete Pesto Pasta",
        priceNgn: 10000,
        proteinSource: "Wheat pasta with tete (amaranth greens)",
        allergens: ["gluten"],
      },
      {
        name: "Creamy Egusi Pasta",
        priceNgn: 10000,
        proteinSource: "Egusi (melon seed) sauce over wheat pasta",
        allergens: ["gluten"],
        proteinId: "egusi",
      },
      {
        name: "Vurger & Fries",
        priceNgn: 10000,
        proteinSource: "Vchunks — wheat-based protein patty",
        allergens: ["gluten"],
      },
    ],
  },
  {
    name: "Breakfast",
    dishes: [
      {
        name: "Sweet Potatoes & Tofu Scramble",
        priceNgn: 8000,
        proteinSource: "Awara (tofu) scramble",
        allergens: ["soy"],
        proteinId: "awara",
      },
      {
        name: "Tofu Basil Toast",
        priceNgn: 7500,
        proteinSource: "Awara (tofu) on toast",
        allergens: ["soy", "gluten"],
        proteinId: "awara",
      },
      {
        name: "Mushroom Toast",
        priceNgn: 8000,
        proteinSource: "Mushrooms on toast",
        allergens: ["gluten"],
        proteinId: "mushrooms",
      },
      {
        name: "Vchunks Wrap Shawarma",
        priceNgn: 4500,
        proteinSource: "Vchunks — wheat-based protein — in a wheat wrap",
        allergens: ["gluten"],
        note: "Homepage listed “Shawarma Wraps” at ₦3,500; menu-page price (₦4,500) used.",
      },
    ],
  },
  {
    name: "Desserts",
    dishes: [
      {
        name: "Tigernut Pudding",
        priceNgn: 6000,
        proteinSource: "Tigernut — dessert, no lead protein",
        allergens: [],
        note: "A stray “75” artifact on the original page was removed.",
      },
      {
        name: "Ogi Panna Cotta",
        priceNgn: 7500,
        proteinSource: "Ogi (fermented maize) — dessert, no lead protein",
        allergens: [],
        note: "The description was truncated on the original page; restored as a clean listing.",
      },
    ],
  },
  {
    name: "Swallow Options",
    dishes: [
      {
        name: "Unripe Plantain Swallow",
        priceNgn: 1000,
        proteinSource: "Accompaniment — the protein comes from the soup",
        allergens: [],
        priceAligned: true,
      },
      {
        name: "Amala",
        priceNgn: 1000,
        proteinSource: "Accompaniment — the protein comes from the soup",
        allergens: [],
        priceAligned: true,
      },
      {
        name: "Eba",
        priceNgn: 1000,
        proteinSource: "Accompaniment — the protein comes from the soup",
        allergens: [],
        priceAligned: true,
      },
      {
        name: "Cabbage Swallow",
        priceNgn: 1000,
        proteinSource: "Accompaniment — the protein comes from the soup",
        allergens: [],
      },
      {
        name: "Eggplant Swallow",
        priceNgn: 1000,
        proteinSource: "Accompaniment — the protein comes from the soup",
        allergens: [],
      },
      {
        name: "Pounded Yam",
        priceNgn: 1000,
        proteinSource: "Accompaniment — the protein comes from the soup",
        allergens: [],
      },
      {
        name: "Guinea Corn Swallow",
        priceNgn: 1000,
        proteinSource: "Accompaniment — the protein comes from the soup",
        allergens: [],
      },
    ],
  },
  {
    name: "Drinks",
    dishes: [
      {
        name: "Zobo",
        priceNgn: 1000,
        proteinSource: "Hibiscus drink — no protein",
        allergens: [],
        note: "Restored: drinks appeared on the homepage but had no category on the menu page.",
      },
      {
        name: "Watermelon Juice",
        priceNgn: 3000,
        proteinSource: "Fresh juice — no protein",
        allergens: [],
      },
      {
        name: "Pineapple Juice",
        priceNgn: 3000,
        proteinSource: "Fresh juice — no protein",
        allergens: [],
      },
    ],
  },
  {
    name: "Big Bowls (Take-Home Soups)",
    dishes: [
      {
        name: "Big Bowl of Soup",
        priceNgn: 15000,
        priceNote: "1L ₦15,000 · 2.5L ₦37,500 · 5L ₦75,000",
        proteinSource:
          "Your choice of soup: Egusi, Afang, Ogbono, Banga, Efo Riro, Ofada Sauce, Oha, Gbegiri/Ewedu, Edikang Ikong, White Soup, Okro, Ila Alassepo",
        allergens: [],
        note: "Restored: Big Bowls were sold on the homepage but missing from the menu page.",
      },
    ],
  },
];

/** The six lapses found in the real menu, in plain words. */
export const MENU_LAPSES_FIXED: string[] = [
  "Two prices for the same dish: the homepage and the menu page disagreed on at least five dishes (Jollof Rice, Egusi Soup, Edikang Ikong, Pineapple Rice, the shawarma wrap). Here every dish has one price — the menu-page price.",
  "Three swallows (Unripe Plantain, Amala, Eba) were published at ₦0 — no price at all. They are shown at ₦1,000, aligned with the other swallows, and footnoted.",
  "No allergen labels anywhere: peanuts sat unlabelled in the Papaya Salad, gluten in every Vchunks dish, soy in the tofu dishes. Allergen chips are now on every card that needs them, and every dish names its protein source — including the stews, whose protein the original menu never named.",
  "No cooking-behaviour information: protein-led dishes now show the functional properties (solubility, water-holding, emulsification, gelation) that decide whether a swap survives a real kitchen.",
  "Whole sections were missing from the menu page: the Drinks and the Big Bowls of soup existed only on the homepage. Both are restored here.",
  "Broken text cleaned up: a stray “75” artifact on the Tigernut Pudding and a truncated description on the Ogi Panna Cotta.",
];
