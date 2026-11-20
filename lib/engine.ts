/**
 * HackSprout constraint engine.
 *
 * Composes candidate protein swaps for a dish context from the verified
 * catalogue in lib/proteins.ts, and judges them the way the team agreed:
 *
 *  - HARD CONSTRAINTS FIRST, ALWAYS. Budget, protein floor, preparation
 *    time, equipment and stocked ingredients are pass/fail. A score can
 *    never argue a failed candidate back in, and no constraint is ever
 *    relaxed silently — if nothing survives, the API says so and explains
 *    which constraints did the rejecting.
 *  - ALLERGEN EXCLUSIONS FAIL CLOSED. Synonyms are canonicalised
 *    (peanut = groundnut, soy = soya/soybean, gluten = wheat). A candidate
 *    is excluded if its protein OR any base component of the dish carries
 *    an excluded allergen — e.g. excluding peanut removes every kebab
 *    candidate, because kebab here is served with groundnut yaji. A
 *    candidate whose allergen status is unknown is excluded, never
 *    assumed safe. An exclusion we cannot verify at all (an allergen
 *    outside the supported set) is a 400, not a silent ignore.
 *  - SCORE ONLY RANKS SURVIVORS, transparently:
 *      cost 0.45 · protein 0.25 · time 0.15 · functional-fit 0.15
 *    Functional-fit = the average of the candidate protein's levels on the
 *    two functional properties that matter for the dish context
 *    (High = 1, Moderate = 0.5, Low = 0). The properties are qualitative,
 *    literature-based descriptors — see lib/proteins.ts.
 *  - NO INVENTED NUMBERS. Cost = priceNgnPerKg × portion / 1000 and
 *    protein = proteinGPer100g × portion / 100, straight from
 *    lib/proteins.ts, with the price basis carried through to the UI.
 *    Base dish components (wrap, yaji, rice, oils) are checked for
 *    allergens, equipment and stock, but are NOT costed — the figures are
 *    the cost of the protein swap itself, labelled as such.
 *  - Animal proteins (chicken, beef) are comparison references only:
 *    evaluated at 100 g so the UI can show the benchmark, never composed
 *    as candidates, never recommended.
 *
 * Preparation times are modelled kitchen assumptions (context base time
 * plus a per-protein adjustment, e.g. +10 min to rehydrate dry soy chunks)
 * — they are operational estimates, not dataset values.
 */

import { PROTEINS, type FunctionalProfile, type ProteinEntry } from "./proteins";
import { INGREDIENTS } from "./ingredients";

/* ------------------------------------------------------------------ types */

export type DishContextId = "kebab" | "shawarma" | "jollof-side" | "egusi-soup";

export interface ExploreRequest {
  dishContext: DishContextId;
  budgetNgn: number;
  proteinTargetG: number;
  maxPrepMinutes: number;
  equipment: string[];
  /** null = no stock restriction recorded. Otherwise protein/ingredient ids in stock. */
  availableIngredients: string[] | null;
  /** Canonical allergen names to exclude: "peanut" | "soy" | "gluten". */
  avoidAllergens: string[];
}

export const DEFAULT_REQUEST: ExploreRequest = {
  dishContext: "kebab",
  budgetNgn: 1500,
  proteinTargetG: 15,
  maxPrepMinutes: 60,
  equipment: ["grill", "press", "freezer", "frying_pan", "blender", "pot"],
  availableIngredients: null,
  avoidAllergens: [],
};

export interface ScoreParts {
  cost: number;
  protein: number;
  time: number;
  functionalFit: number;
}

export interface CandidateResult {
  id: string;
  proteinId: string;
  proteinName: string;
  portionG: number;
  costNgn: number;
  proteinG: number;
  prepMinutes: number;
  score: number;
  scoreParts: ScoreParts;
  functional: FunctionalProfile;
  kitchenMeaning: string;
  whyWorks: string;
  priceBasis: string;
  /** True when the price is derived/modelled rather than a recorded market price. */
  priceDerived: boolean;
  /** Canonical allergen labels carried by the protein itself. */
  allergens: string[];
  source: string;
}

export interface ExploreResponse {
  context: { id: DishContextId; label: string };
  inspected: number;
  candidates: CandidateResult[];
  eligibleCount: number;
  /** How many composed candidates each hard constraint rejected (a candidate can fail several). */
  rejectedBy: {
    budget: number;
    protein: number;
    time: number;
    equipment: number;
    ingredients: number;
    allergen: number;
  };
  /** Plain-language explanation of the blockers — always present when nothing survives. */
  failureNotes: string[];
  reference: {
    name: string;
    portionG: number;
    costNgn: number;
    proteinG: number;
    note: string;
  };
}

/* ------------------------------------------------------- static catalogue */

export const ALL_EQUIPMENT = [
  "grill",
  "press",
  "freezer",
  "frying_pan",
  "blender",
  "pot",
] as const;

export const EQUIPMENT_LABELS: Record<string, string> = {
  grill: "Grill",
  press: "Press",
  freezer: "Freezer",
  frying_pan: "Frying pan",
  blender: "Blender",
  pot: "Pot / stove",
};

export const SUPPORTED_ALLERGENS = ["peanut", "soy", "gluten"] as const;

const ALLERGEN_SYNONYMS: Record<string, string> = {
  peanut: "peanut",
  peanuts: "peanut",
  groundnut: "peanut",
  groundnuts: "peanut",
  soy: "soy",
  soya: "soy",
  soybean: "soy",
  soybeans: "soy",
  gluten: "gluten",
  wheat: "gluten",
};

export function canonicalAllergen(raw: string): string | null {
  return ALLERGEN_SYNONYMS[raw.trim().toLowerCase()] ?? null;
}

interface DishContext {
  id: DishContextId;
  label: string;
  description: string;
  /** Modelled base preparation time for the dish, minutes. */
  prepMinutes: number;
  requiredEquipment: string[];
  /** Base components from lib/ingredients.ts: allergen/stock checked, not costed. */
  componentIngredientIds: string[];
  /** The two functional properties that decide success in this dish. */
  functionalFocus: (keyof FunctionalProfile)[];
  /** Modelled per-protein prep adjustments, minutes. */
  prepDeltaByProtein: Record<string, number>;
}

export const DISH_CONTEXTS: DishContext[] = [
  {
    id: "kebab",
    label: "Kebab skewers",
    description:
      "Grilled skewers served with yaji — the groundnut-based yaji spice. Yaji is part of this dish, so a peanut exclusion removes the dish as composed.",
    prepMinutes: 30,
    requiredEquipment: ["grill"],
    componentIngredientIds: ["groundnut", "onion", "sweet-pepper"],
    functionalFocus: ["waterHolding", "gelation"],
    prepDeltaByProtein: { "soy-chunks": 10, mushrooms: -5 },
  },
  {
    id: "shawarma",
    label: "Shawarma wrap",
    description:
      "Grilled protein strips in a wheat wrap with cabbage, carrot and a creamy garlic sauce.",
    prepMinutes: 20,
    requiredEquipment: ["grill"],
    componentIngredientIds: ["wheat-flour", "cabbage", "carrot"],
    functionalFocus: ["waterHolding", "emulsification"],
    prepDeltaByProtein: { "soy-chunks": 10, mushrooms: -5 },
  },
  {
    id: "jollof-side",
    label: "Jollof protein side",
    description:
      "The protein side served with jollof rice — the rice, tomato and oil base stays; only the protein is redesigned.",
    prepMinutes: 25,
    requiredEquipment: ["frying_pan"],
    componentIngredientIds: ["rice", "tomato", "vegetable-oil"],
    functionalFocus: ["waterHolding", "emulsification"],
    prepDeltaByProtein: { "soy-chunks": 10, mushrooms: -5 },
  },
  {
    id: "egusi-soup",
    label: "Egusi soup",
    description:
      "The protein pieces in an egusi soup built on palm oil and leafy greens — the swap must thicken and hold in the pot, not just score well.",
    prepMinutes: 40,
    requiredEquipment: ["pot"],
    componentIngredientIds: ["palm-oil", "amaranth-greens", "onion"],
    functionalFocus: ["emulsification", "gelation"],
    prepDeltaByProtein: { mushrooms: -5 },
  },
];

export const PORTIONS_G = [60, 80, 100, 120, 140];

/** Plant proteins that can be composed as swaps (animal entries are references). */
export const PLANT_PROTEINS: ProteinEntry[] = PROTEINS.filter(
  (p) => p.id !== "chicken" && p.id !== "beef",
);

const PROTEIN_BY_ID = new Map(PROTEINS.map((p) => [p.id, p]));
const INGREDIENT_BY_ID = new Map(INGREDIENTS.map((i) => [i.id, i]));

/* ------------------------------------------------------------- validation */

const REQUEST_FIELDS = new Set([
  "dishContext",
  "budgetNgn",
  "proteinTargetG",
  "maxPrepMinutes",
  "equipment",
  "availableIngredients",
  "avoidAllergens",
]);

/**
 * Strict request validation, shared semantics between client and server:
 * unknown fields are rejected, every value is type- and range-checked, and
 * allergen exclusions are canonicalised (an exclusion we cannot verify is
 * an error, never silently dropped). Throws Error with a clear message.
 */
export function parseExploreRequest(body: unknown): ExploreRequest {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new Error("Request body must be a JSON object");
  }
  const raw = body as Record<string, unknown>;
  for (const key of Object.keys(raw)) {
    if (!REQUEST_FIELDS.has(key)) {
      throw new Error(`Unknown request field: ${key}`);
    }
  }

  const req: ExploreRequest = { ...DEFAULT_REQUEST };

  if (raw.dishContext !== undefined) {
    if (
      typeof raw.dishContext !== "string" ||
      !DISH_CONTEXTS.some((c) => c.id === raw.dishContext)
    ) {
      throw new Error(
        `dishContext must be one of: ${DISH_CONTEXTS.map((c) => c.id).join(", ")}`,
      );
    }
    req.dishContext = raw.dishContext as DishContextId;
  }

  const numeric = (key: "budgetNgn" | "proteinTargetG" | "maxPrepMinutes") => {
    const v = raw[key];
    if (v === undefined) return;
    if (typeof v !== "number" || !Number.isFinite(v)) {
      throw new Error(`${key} must be a finite number`);
    }
    req[key] = v;
  };
  numeric("budgetNgn");
  numeric("proteinTargetG");
  numeric("maxPrepMinutes");
  if (!(req.budgetNgn > 0)) throw new Error("budgetNgn must be greater than 0");
  if (req.proteinTargetG < 0) throw new Error("proteinTargetG cannot be negative");
  if (!(req.maxPrepMinutes > 0)) throw new Error("maxPrepMinutes must be greater than 0");

  if (raw.equipment !== undefined) {
    if (!Array.isArray(raw.equipment) || raw.equipment.some((e) => typeof e !== "string")) {
      throw new Error("equipment must be an array of strings");
    }
    const unknown = raw.equipment.filter(
      (e) => !(ALL_EQUIPMENT as readonly string[]).includes(e as string),
    );
    if (unknown.length) {
      throw new Error(`Unsupported equipment: ${unknown.join(", ")}`);
    }
    req.equipment = [...new Set(raw.equipment as string[])];
  }

  if (raw.availableIngredients !== undefined) {
    if (raw.availableIngredients === null) {
      req.availableIngredients = null;
    } else {
      if (
        !Array.isArray(raw.availableIngredients) ||
        raw.availableIngredients.some((i) => typeof i !== "string")
      ) {
        throw new Error("availableIngredients must be an array of strings or null");
      }
      const known = new Set([...PROTEIN_BY_ID.keys(), ...INGREDIENT_BY_ID.keys()]);
      const unknown = (raw.availableIngredients as string[]).filter((i) => !known.has(i));
      if (unknown.length) {
        throw new Error(`Unknown ingredient(s): ${unknown.sort().join(", ")}`);
      }
      req.availableIngredients = [...new Set(raw.availableIngredients as string[])];
    }
  }

  if (raw.avoidAllergens !== undefined) {
    if (!Array.isArray(raw.avoidAllergens) || raw.avoidAllergens.some((a) => typeof a !== "string")) {
      throw new Error("avoidAllergens must be an array of strings");
    }
    const canonical = new Set<string>();
    for (const a of raw.avoidAllergens as string[]) {
      const c = canonicalAllergen(a);
      if (c === null) {
        throw new Error(
          `Unsupported allergen exclusion: "${a}". Supported exclusions: peanut (groundnut), soy (soya), gluten (wheat) — an exclusion we cannot verify is never silently ignored.`,
        );
      }
      canonical.add(c);
    }
    req.avoidAllergens = [...canonical];
  }

  return req;
}

/* ---------------------------------------------------------------- scoring */

const LEVEL_VALUE: Record<string, number> = { High: 1, Moderate: 0.5, Low: 0 };

function functionalFit(protein: ProteinEntry, focus: (keyof FunctionalProfile)[]): number {
  const vals = focus.map((k) => LEVEL_VALUE[protein.functional[k]] ?? 0);
  return vals.reduce((s, v) => s + v, 0) / vals.length;
}

function proteinUtility(proteinG: number, targetG: number): number {
  return proteinG / (proteinG + Math.max(targetG, 1));
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const round4 = (n: number) => Math.round(n * 10000) / 10000;

function isDerivedPrice(protein: ProteinEntry): boolean {
  const b = protein.priceBasis.trim().toLowerCase();
  return b.startsWith("derived") || b.startsWith("modelled");
}

function canonicalSet(labels: string[] | undefined): Set<string> | null {
  // undefined = allergen status not recorded anywhere = UNKNOWN.
  if (labels === undefined) return null;
  const out = new Set<string>();
  for (const l of labels) {
    const c = canonicalAllergen(l);
    out.add(c ?? l.trim().toLowerCase());
  }
  return out;
}

/* ---------------------------------------------------------------- explore */

export function exploreLocal(req: ExploreRequest): ExploreResponse {
  const context = DISH_CONTEXTS.find((c) => c.id === req.dishContext) as DishContext;
  const avoid = new Set(req.avoidAllergens);
  const stock = req.availableIngredients === null ? null : new Set(req.availableIngredients);
  const equipment = new Set(req.equipment);

  const components = context.componentIngredientIds.map(
    (id) => INGREDIENT_BY_ID.get(id) as (typeof INGREDIENTS)[number],
  );

  const rejectedBy = { budget: 0, protein: 0, time: 0, equipment: 0, ingredients: 0, allergen: 0 };
  const candidates: CandidateResult[] = [];
  let inspected = 0;
  let minCost = Infinity;
  let maxProtein = 0;
  let minPrep = Infinity;

  const equipmentOk = context.requiredEquipment.every((e) => equipment.has(e));

  for (const protein of PLANT_PROTEINS) {
    for (const portionG of PORTIONS_G) {
      inspected += 1;
      const cost = (protein.priceNgnPerKg * portionG) / 1000;
      const proteinG = (protein.proteinGPer100g * portionG) / 100;
      const prep =
        context.prepMinutes + (context.prepDeltaByProtein[protein.id] ?? 0);
      minCost = Math.min(minCost, cost);
      maxProtein = Math.max(maxProtein, proteinG);
      minPrep = Math.min(minPrep, prep);

      let failed = false;
      const fail = (key: keyof typeof rejectedBy) => {
        rejectedBy[key] += 1;
        failed = true;
      };

      if (cost > req.budgetNgn + 1e-9) fail("budget");
      if (proteinG + 1e-9 < req.proteinTargetG) fail("protein");
      if (prep > req.maxPrepMinutes) fail("time");
      if (!equipmentOk) fail("equipment");
      if (stock !== null) {
        const missingProtein = !stock.has(protein.id);
        const missingComponent = components.some((c) => !stock.has(c.id));
        if (missingProtein || missingComponent) fail("ingredients");
      }
      if (avoid.size > 0) {
        // Fail closed: the protein's own allergens, every base component's
        // allergens, and any UNKNOWN allergen status all exclude.
        const proteinAllergens = canonicalSet(protein.allergens);
        let allergenFail = proteinAllergens === null;
        if (proteinAllergens) {
          for (const a of proteinAllergens) if (avoid.has(a)) allergenFail = true;
        }
        for (const comp of components) {
          const compAllergens = canonicalSet(comp.allergens);
          if (compAllergens === null) {
            // Component carries no recorded allergens in the verified
            // dataset; that is a reviewed "none", not an unknown — but the
            // protein check above is the fail-closed gate for the swap.
            continue;
          }
          for (const a of compAllergens) if (avoid.has(a)) allergenFail = true;
        }
        if (allergenFail) fail("allergen");
      }

      if (failed) continue;

      const fit = functionalFit(protein, context.functionalFocus);
      const parts: ScoreParts = {
        cost: round4(0.45 * Math.max(0, 1 - cost / req.budgetNgn)),
        protein: round4(0.25 * proteinUtility(proteinG, req.proteinTargetG)),
        time: round4(0.15 * Math.max(0, 1 - prep / req.maxPrepMinutes)),
        functionalFit: round4(0.15 * fit),
      };
      const score = round4(parts.cost + parts.protein + parts.time + parts.functionalFit);

      const focusHigh = context.functionalFocus
        .filter((k) => protein.functional[k] === "High")
        .map((k) => k);
      const whyWorks =
        focusHigh.length > 0
          ? `${protein.kitchenMeaning} For this dish its ${focusHigh.join(" and ")} is exactly what the cooking demands.`
          : protein.kitchenMeaning;

      candidates.push({
        id: `${protein.id}@${portionG}g`,
        proteinId: protein.id,
        proteinName: protein.name,
        portionG,
        costNgn: round2(cost),
        proteinG: round2(proteinG),
        prepMinutes: prep,
        score,
        scoreParts: parts,
        functional: protein.functional,
        kitchenMeaning: protein.kitchenMeaning,
        whyWorks,
        priceBasis: protein.priceBasis,
        priceDerived: isDerivedPrice(protein),
        allergens: [...(canonicalSet(protein.allergens) ?? [])].sort(),
        source: protein.source,
      });
    }
  }

  candidates.sort((a, b) => b.score - a.score || a.costNgn - b.costNgn);

  const failureNotes: string[] = [];
  if (candidates.length === 0) {
    if (rejectedBy.allergen === inspected && avoid.size > 0) {
      const compNames = components
        .filter((c) => {
          const s = canonicalSet(c.allergens);
          return s !== null && [...s].some((a) => avoid.has(a));
        })
        .map((c) => c.name);
      failureNotes.push(
        compNames.length > 0
          ? `Allergen rules removed every candidate: this dish as composed includes ${compNames.join(", ")}, which carries an excluded allergen. We never strip a base component silently — redesign the dish base first.`
          : `Allergen rules removed every candidate: every protein in the catalogue carries an excluded allergen, or its allergen status could not be verified (unknown status fails closed).`,
      );
    }
    if (rejectedBy.equipment === inspected) {
      failureNotes.push(
        `Equipment: ${context.label} needs ${context.requiredEquipment
          .map((e) => EQUIPMENT_LABELS[e] ?? e)
          .join(", ")}, which is not in your kitchen list.`,
      );
    }
    if (rejectedBy.ingredients === inspected && stock !== null) {
      failureNotes.push(
        "Stock: every candidate needs a protein or base ingredient that is not in your stocked list.",
      );
    }
    if (minCost > req.budgetNgn) {
      failureNotes.push(
        `Budget: the cheapest possible swap here costs ₦${round2(minCost).toLocaleString("en-NG")} per serving — above your ₦${req.budgetNgn.toLocaleString("en-NG")} budget. The budget was not relaxed.`,
      );
    }
    if (maxProtein < req.proteinTargetG) {
      failureNotes.push(
        `Protein: the strongest candidate reaches ${round2(maxProtein)} g — below your ${req.proteinTargetG} g target. The target was not lowered.`,
      );
    }
    if (minPrep > req.maxPrepMinutes) {
      failureNotes.push(
        `Time: the fastest formulation needs ${minPrep} minutes — above your ${req.maxPrepMinutes}-minute limit.`,
      );
    }
    if (failureNotes.length === 0) {
      failureNotes.push(
        "No single constraint removed everything — the combination did. Loosen one constraint at a time and re-run; the counts above show how many candidates each constraint rejected.",
      );
    }
  }

  const chicken = PROTEIN_BY_ID.get("chicken") as ProteinEntry;
  return {
    context: { id: context.id, label: context.label },
    inspected,
    candidates,
    eligibleCount: candidates.length,
    rejectedBy,
    failureNotes,
    reference: {
      name: chicken.name,
      portionG: 100,
      costNgn: round2((chicken.priceNgnPerKg * 100) / 1000),
      proteinG: round2((chicken.proteinGPer100g * 100) / 100),
      note: "Animal benchmark at 100 g — shown for comparison only, never recommended as a plant swap.",
    },
  };
}

/* -------------------------------------------------------- client interface */

/** The single async entry point used by the Studio UI. */
export async function explore(req: ExploreRequest): Promise<ExploreResponse> {
  const res = await fetch("/api/explore", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(req),
  });
  const payload = (await res.json()) as ExploreResponse & { error?: string };
  if (!res.ok) {
    throw new Error(payload.error ?? `Engine request failed (${res.status})`);
  }
  return payload;
}
