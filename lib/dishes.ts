/**
 * HackSprout — transformable dish model (engine v2 input).
 *
 * A transformable dish is an EXISTING menu item decomposed into the parts
 * the transformation engine needs: the protein it is built around today,
 * how much of it, how it is cooked, what it sells for, and the base
 * components that stay fixed while the protein is redesigned.
 *
 * The dishes below are decomposed from lib/menu.ts (the Veggie Victory
 * menu, lapses fixed); `sellingPriceNgn` is the menu price of the dish
 * named in each comment. Veggie Victory's dishes are already plant-based,
 * so `currentProteinId` is set to the ANIMAL protein the dish
 * traditionally replaces — that is the transformation story the hackathon
 * asks for (animal → plant), and it makes the original cost/protein the
 * honest benchmark the swap is judged against.
 *
 * Two documented exceptions, because the verified catalogue in
 * lib/proteins.ts is the only source of numbers we are allowed to use:
 *  - Asun is traditionally goat. Goat has no row in the verified
 *    catalogue, so beef (WAFCT red meat, WFP-priced) is the reference and
 *    the dish carries a note saying so. We do not invent a goat row.
 *  - The tofu scramble traditionally replaces egg. Egg likewise has no
 *    verified row, so the baseline is the dish's current protein (awara)
 *    and the transform reads as an optimisation, not an animal→plant swap.
 */

import { PROTEINS } from "./proteins";
import { INGREDIENTS } from "./ingredients";

export type CookingMethod =
  | "grill"
  | "fry"
  | "boil"
  | "soup"
  | "stew"
  | "wrap"
  | "raw";

export const COOKING_METHODS: CookingMethod[] = [
  "grill",
  "fry",
  "boil",
  "soup",
  "stew",
  "wrap",
  "raw",
];

export interface TransformableDish {
  dishId: string;
  name: string;
  /** proteins.ts id of the protein the dish is built around today. */
  currentProteinId: string;
  /** Grams of that protein in one serving, as the dish is composed today. */
  currentPortionG: number;
  cookingMethod: CookingMethod;
  /** Menu selling price of the dish, NGN (from lib/menu.ts). */
  sellingPriceNgn: number;
  /** ingredients.ts ids that stay fixed while the protein is redesigned. */
  baseComponentIds: string[];
  /** Honest caveats about the decomposition, where they exist. */
  note?: string;
}

export const TRANSFORMABLE_DISHES: TransformableDish[] = [
  {
    // Menu: "Vchunks Kebab" ₦2,000 / "Mini Kebab Skewer" ₦1,500 — the
    // traditional dish is beef suya skewers; beef is the benchmark.
    dishId: "kebab-skewers",
    name: "Kebab Skewers",
    currentProteinId: "beef",
    currentPortionG: 100,
    cookingMethod: "grill",
    sellingPriceNgn: 2000,
    baseComponentIds: ["groundnut", "onion", "sweet-pepper"],
    note: "Served with groundnut yaji — the yaji is part of the dish, so a peanut exclusion removes the dish as composed.",
  },
  {
    // Menu: "Vchunks Wrap Shawarma" ₦4,500 — traditionally chicken shawarma.
    dishId: "shawarma-wrap",
    name: "Shawarma Wrap",
    currentProteinId: "chicken",
    currentPortionG: 100,
    cookingMethod: "wrap",
    sellingPriceNgn: 4500,
    baseComponentIds: ["wheat-flour", "cabbage", "carrot", "garlic"],
  },
  {
    // Menu: "Jollof Rice" ₦8,500 — the rice base stays; the fried chicken
    // side is the protein being redesigned.
    dishId: "jollof-chicken-side",
    name: "Jollof Rice with Chicken Side",
    currentProteinId: "chicken",
    currentPortionG: 100,
    cookingMethod: "fry",
    sellingPriceNgn: 8500,
    baseComponentIds: ["rice", "tomato", "tomato-paste", "vegetable-oil", "onion"],
  },
  {
    // Menu: "Egusi Soup" ₦8,500 — traditionally assorted beef pieces in an
    // egusi base; the pieces are what get redesigned.
    dishId: "egusi-soup",
    name: "Egusi Soup",
    currentProteinId: "beef",
    currentPortionG: 80,
    cookingMethod: "soup",
    sellingPriceNgn: 8500,
    baseComponentIds: ["palm-oil", "amaranth-greens", "onion"],
  },
  {
    // Menu: "Efo Riro" ₦8,500 — traditionally beef pieces in the greens.
    dishId: "efo-riro",
    name: "Efo Riro",
    currentProteinId: "beef",
    currentPortionG: 80,
    cookingMethod: "stew",
    sellingPriceNgn: 8500,
    baseComponentIds: ["amaranth-greens", "tomato", "sweet-pepper", "palm-oil", "onion"],
  },
  {
    // Menu: "Edikang Ikong Soup" ₦8,500 — traditionally beef (and seafood)
    // in the leafy base; beef is the verified-catalogue benchmark.
    dishId: "edikang-ikong",
    name: "Edikang Ikong Soup",
    currentProteinId: "beef",
    currentPortionG: 80,
    cookingMethod: "soup",
    sellingPriceNgn: 8500,
    baseComponentIds: ["amaranth-greens", "palm-oil", "onion"],
  },
  {
    // Menu: "Nkwobi (Vchunks)" ₦6,000 — traditionally cow foot in palm-oil
    // sauce; beef is the verified red-meat reference for it.
    dishId: "nkwobi",
    name: "Nkwobi",
    currentProteinId: "beef",
    currentPortionG: 100,
    cookingMethod: "stew",
    sellingPriceNgn: 6000,
    baseComponentIds: ["palm-oil", "onion"],
    note: "Traditionally cow foot; beef is the closest verified red-meat reference in the catalogue.",
  },
  {
    // Menu: "Asun – Spicy Vchunks" ₦6,000 — traditionally chargrilled goat.
    dishId: "asun",
    name: "Asun",
    currentProteinId: "beef",
    currentPortionG: 100,
    cookingMethod: "grill",
    sellingPriceNgn: 6000,
    baseComponentIds: ["chilli-pepper", "onion", "vegetable-oil"],
    note: "Traditionally goat. Goat has no row in the verified catalogue (lib/proteins.ts), so beef is used as the red-meat reference rather than inventing goat data.",
  },
  {
    // Menu: "Vurger & Fries" ₦10,000 — traditionally a beef patty.
    dishId: "vurger",
    name: "Vurger",
    currentProteinId: "beef",
    currentPortionG: 100,
    cookingMethod: "fry",
    sellingPriceNgn: 10000,
    baseComponentIds: ["wheat-flour", "tomato", "cabbage", "onion"],
  },
  {
    // Menu: "Ofada Rice" ₦9,000 — the ayamase/ofada sauce traditionally
    // carries beef pieces; the pepper sauce base stays.
    dishId: "ofada-rice",
    name: "Ofada Rice & Sauce",
    currentProteinId: "beef",
    currentPortionG: 80,
    cookingMethod: "stew",
    sellingPriceNgn: 9000,
    baseComponentIds: ["rice", "sweet-pepper", "chilli-pepper", "palm-oil", "onion"],
  },
  {
    // Menu: "Sweet Potatoes & Tofu Scramble" ₦8,000 — a scramble
    // traditionally made with egg.
    dishId: "tofu-scramble",
    name: "Tofu Scramble Breakfast",
    currentProteinId: "awara",
    currentPortionG: 100,
    cookingMethod: "fry",
    sellingPriceNgn: 8000,
    baseComponentIds: ["vegetable-oil", "onion", "sweet-pepper"],
    note: "Traditionally an egg scramble. Egg has no row in the verified catalogue, so the dish's current protein (awara) is the baseline — this transform is an optimisation of an already plant-based dish, not an animal→plant swap.",
  },
  {
    // Menu: "Creamy Egusi Pasta" ₦10,000 — the fusion original is a creamy
    // chicken pasta; the chicken is the benchmark protein.
    dishId: "creamy-egusi-pasta",
    name: "Creamy Egusi Pasta",
    currentProteinId: "chicken",
    currentPortionG: 80,
    cookingMethod: "boil",
    sellingPriceNgn: 10000,
    baseComponentIds: ["wheat-flour", "amaranth-greens", "garlic", "vegetable-oil"],
  },
];

/* ------------------------------------------------------------ user dishes */

export interface UserDishInput {
  name: string;
  currentProteinId: string;
  currentPortionG: number;
  cookingMethod: CookingMethod;
  sellingPriceNgn: number;
  baseComponentIds?: string[];
}

const PROTEIN_IDS = new Set(PROTEINS.map((p) => p.id));
const INGREDIENT_IDS = new Set(INGREDIENTS.map((i) => i.id));

function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug.length > 0 ? `user-${slug}` : "user-dish";
}

/**
 * Build a TransformableDish from structured user input (the "any dish"
 * path). Structured fields only — no free-text recipe parsing. Throws
 * Error with a clear message on any invalid field; the API turns that
 * into a 400.
 */
export function dishFromUserInput(input: UserDishInput): TransformableDish {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new Error("dish must be a JSON object");
  }
  const raw = input as unknown as Record<string, unknown>;
  const ALLOWED = new Set([
    "name",
    "currentProteinId",
    "currentPortionG",
    "cookingMethod",
    "sellingPriceNgn",
    "baseComponentIds",
  ]);
  for (const key of Object.keys(raw)) {
    if (!ALLOWED.has(key)) {
      throw new Error(`Unknown dish field: ${key}`);
    }
  }

  if (typeof raw.name !== "string" || raw.name.trim().length === 0 || raw.name.length > 120) {
    throw new Error("dish.name must be a non-empty string (max 120 characters)");
  }
  if (typeof raw.currentProteinId !== "string" || !PROTEIN_IDS.has(raw.currentProteinId)) {
    throw new Error(
      `dish.currentProteinId must be one of: ${[...PROTEIN_IDS].join(", ")}`,
    );
  }
  if (
    typeof raw.currentPortionG !== "number" ||
    !Number.isFinite(raw.currentPortionG) ||
    raw.currentPortionG < 20 ||
    raw.currentPortionG > 500
  ) {
    throw new Error("dish.currentPortionG must be a number between 20 and 500");
  }
  if (
    typeof raw.cookingMethod !== "string" ||
    !COOKING_METHODS.includes(raw.cookingMethod as CookingMethod)
  ) {
    throw new Error(`dish.cookingMethod must be one of: ${COOKING_METHODS.join(", ")}`);
  }
  if (
    typeof raw.sellingPriceNgn !== "number" ||
    !Number.isFinite(raw.sellingPriceNgn) ||
    !(raw.sellingPriceNgn > 0)
  ) {
    throw new Error("dish.sellingPriceNgn must be a number greater than 0");
  }

  let baseComponentIds: string[] = [];
  if (raw.baseComponentIds !== undefined) {
    if (
      !Array.isArray(raw.baseComponentIds) ||
      raw.baseComponentIds.some((b) => typeof b !== "string")
    ) {
      throw new Error("dish.baseComponentIds must be an array of ingredient ids");
    }
    const unknown = (raw.baseComponentIds as string[]).filter((b) => !INGREDIENT_IDS.has(b));
    if (unknown.length) {
      throw new Error(`Unknown base ingredient(s): ${unknown.sort().join(", ")}`);
    }
    baseComponentIds = [...new Set(raw.baseComponentIds as string[])];
  }

  return {
    dishId: slugify(raw.name),
    name: raw.name.trim(),
    currentProteinId: raw.currentProteinId,
    currentPortionG: raw.currentPortionG,
    cookingMethod: raw.cookingMethod as CookingMethod,
    sellingPriceNgn: raw.sellingPriceNgn,
    baseComponentIds,
  };
}
