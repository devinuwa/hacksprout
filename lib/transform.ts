/**
 * HackSprout engine v2 — dish transformation.
 *
 * Where engine.ts (v1) composes swaps for a fixed dish context, v2 takes
 * an EXISTING dish (lib/dishes.ts), decomposes it, and recommends a
 * credible plant-based transformation of its protein under defined
 * constraints — with the reasoning visible in a plain-language trace.
 * This is "generative AI with structure" as the hackathon guide asks:
 * generation is constrained by verified data and rules at every step.
 * Nothing here generates recipe text, and no number is invented — cost
 * and protein come straight from lib/proteins.ts, exactly as in v1.
 *
 * THE PIPELINE (hard gates first, in this order — a score can never
 * argue a failed candidate back in):
 *   1. Allergen — fail closed, synonyms canonicalised (peanut =
 *      groundnut, soy = soya, gluten = wheat), checked against the
 *      candidate protein AND the dish's base components. A base
 *      component carrying an excluded allergen rejects every candidate:
 *      we never strip part of a dish silently.
 *   2. Method survival — a rule-based predictive model (below) decides
 *      whether the protein's functional profile can survive the dish's
 *      cooking method.
 *   3. Protein floor — the swap must keep at least `minProteinRatio`
 *      (default 90%) of the original protein, at the candidate's own
 *      portion.
 *   4. Budget — candidate cost must fit the cap. The default cap is the
 *      cost of the protein being replaced: a swap may not quietly cost
 *      more than what it replaces. If nothing survives at that cap, that
 *      is a legitimate, reported outcome — the cheapest near-miss is
 *      named in the trace instead of relaxing the cap.
 *   5. Prep time — only when the caller sets maxPrepMinutes.
 *
 * COST MODEL — protein-only, labelled. lib/ingredients.ts carries no
 * prices in the verified dataset, so base components are allergen-checked
 * but not costed; every result carries `costModel: "protein-only"` and
 * the trace says so. Protein cost = priceNgnPerKg × portion / 1000.
 *
 * METHOD-SURVIVAL MODEL — honest scope. METHOD_REQUIREMENTS encodes, per
 * cooking method, which functional properties matter and the minimum
 * level, each with its food-science reason. The functional profiles are
 * QUALITATIVE literature-based descriptors (see lib/proteins.ts), so
 * this is a rule-based prediction over qualitative data — a structured
 * screening model, not a lab-validated simulation. It is documented as
 * such wherever its output is shown.
 *
 * SCORING (survivors only): cost 0.35 · protein 0.25 · functional fit
 * 0.25 · familiarity 0.15.
 *   - cost: 1 − candidateCost / cap, against the cap in force.
 *   - protein: candidateG / (candidateG + originalG) — a saturating
 *     utility, so doubling protein does not double the reward.
 *   - functional fit: mean level (High 1, Moderate 0.5, Low 0) across the
 *     properties the method's requirements actually test.
 *   - familiarity: FAMILIARITY below — modelled team judgement about how
 *     established each protein already is in Nigerian kitchens, kept as
 *     data with its reasons, not hidden in code.
 *
 * PREP TIMES are modelled kitchen assumptions (method base time plus a
 * per-protein adjustment, e.g. +10 min to rehydrate dry soy chunks,
 * +20 min for hard bambara to boil soft) — operational estimates, not
 * dataset values, same convention as engine.ts.
 */

import {
  PROTEINS,
  type FunctionalLevel,
  type FunctionalProfile,
  type ProteinEntry,
} from "./proteins";
import { INGREDIENTS } from "./ingredients";
import { PLANT_PROTEINS, PORTIONS_G, canonicalAllergen } from "./engine";
import {
  TRANSFORMABLE_DISHES,
  dishFromUserInput,
  type CookingMethod,
  type TransformableDish,
  type UserDishInput,
} from "./dishes";

/* ---------------------------------------------------------------- helpers */

const round2 = (n: number) => Math.round(n * 100) / 100;
const round4 = (n: number) => Math.round(n * 10000) / 10000;
const fmtNgn = (n: number) => `₦${round2(n).toLocaleString("en-NG")}`;
const fmtG = (n: number) => `${Math.round(n * 10) / 10} g`;

const PROTEIN_BY_ID = new Map(PROTEINS.map((p) => [p.id, p]));
const INGREDIENT_BY_ID = new Map(INGREDIENTS.map((i) => [i.id, i]));

const LEVEL_NUM: Record<FunctionalLevel, number> = { Low: 0, Moderate: 1, High: 2 };
const LEVEL_NAME: Record<number, FunctionalLevel> = { 0: "Low", 1: "Moderate", 2: "High" };
const PROPERTY_LABEL: Record<keyof FunctionalProfile, string> = {
  solubility: "solubility",
  waterHolding: "water-holding",
  emulsification: "emulsification",
  gelation: "gelation",
};

function canonicalSet(labels: string[] | undefined): Set<string> {
  const out = new Set<string>();
  for (const l of labels ?? []) {
    const c = canonicalAllergen(l);
    out.add(c ?? l.trim().toLowerCase());
  }
  return out;
}

function isDerivedPrice(protein: ProteinEntry): boolean {
  const b = protein.priceBasis.trim().toLowerCase();
  return b.startsWith("derived") || b.startsWith("modelled");
}

/** First clause of a price basis, for compact trace lines. */
function shortBasis(protein: ProteinEntry): string {
  return protein.priceBasis.split("—")[0].split(";")[0].trim();
}

/* ------------------------------------------- method-survival requirements */

export interface PropertyThreshold {
  property: keyof FunctionalProfile;
  /** Minimum level (Low 0, Moderate 1, High 2), if this is a floor test. */
  minLevel?: number;
  /** Maximum level, if this is a ceiling test (e.g. must not dissolve). */
  maxLevel?: number;
}

export interface MethodRequirement {
  /** Short name for the requirement, used in reasoning lines. */
  label: string;
  /** The requirement passes if ANY alternative meets its threshold. */
  alternatives: PropertyThreshold[];
  /** The food-science reason this requirement exists. */
  reason: string;
}

export const METHOD_REQUIREMENTS: Record<CookingMethod, MethodRequirement[]> = {
  grill: [
    {
      label: "Structure on the skewer",
      alternatives: [
        { property: "gelation", minLevel: 1 },
        { property: "waterHolding", minLevel: 2 },
      ],
      reason:
        "over open heat a piece must hold together on the skewer — it needs a set gel structure (gelation ≥ Moderate) or exceptional water-holding (High) that keeps the formed piece intact",
    },
    {
      label: "Stays juicy under dry heat",
      alternatives: [{ property: "waterHolding", minLevel: 1 }],
      reason:
        "grilling drives moisture off the surface, so water-holding of at least Moderate keeps the piece from drying into leather",
    },
  ],
  fry: [
    {
      label: "Holds shape in hot oil",
      alternatives: [
        { property: "gelation", minLevel: 1 },
        { property: "waterHolding", minLevel: 2 },
      ],
      reason:
        "a fried piece must arrive pre-formed or set in the pan — gelation ≥ Moderate gives batter adhesion and structure; very high water-holding marks a hydrated, formed chunk that fries as one piece",
    },
    {
      label: "Moist inside, crisp outside",
      alternatives: [{ property: "waterHolding", minLevel: 1 }],
      reason:
        "water-holding of at least Moderate lets the surface crisp while the inside stays moist instead of hollowing out",
    },
  ],
  boil: [
    {
      label: "Does not disintegrate in the pot",
      alternatives: [
        { property: "gelation", minLevel: 1 },
        { property: "waterHolding", minLevel: 2 },
      ],
      reason:
        "boiling agitates and leaches — the protein must be a set gel (gelation ≥ Moderate) or a formed, highly water-holding piece to come out of the pot as pieces, not cloud",
    },
    {
      label: "Does not dissolve away",
      alternatives: [
        { property: "solubility", maxLevel: 1 },
        { property: "emulsification", minLevel: 2 },
      ],
      reason:
        "a highly soluble protein disperses into the cooking liquid; that is only acceptable when it is there to emulsify the dish (emulsification High), not when pieces are expected",
    },
  ],
  soup: [
    {
      label: "Gives the soup body, or holds as pieces",
      alternatives: [
        { property: "emulsification", minLevel: 1 },
        { property: "gelation", minLevel: 1 },
        { property: "waterHolding", minLevel: 2 },
      ],
      reason:
        "a soup protein must either emulsify and thicken the broth, set into pieces that hold in hot liquid, or arrive as a formed water-holding chunk — otherwise the soup is water with flavouring",
    },
    {
      label: "Does not dissolve away",
      alternatives: [
        { property: "solubility", maxLevel: 1 },
        { property: "emulsification", minLevel: 1 },
      ],
      reason:
        "in a served soup the protein should still be identifiable — high solubility is acceptable only when the protein's job is to emulsify the broth itself",
    },
  ],
  stew: [
    {
      label: "Thickens the stew, or holds through simmering",
      alternatives: [
        { property: "emulsification", minLevel: 1 },
        { property: "gelation", minLevel: 1 },
        { property: "waterHolding", minLevel: 2 },
      ],
      reason:
        "a stew simmers long and reduces — the protein must emulsify into the sauce, hold as set pieces, or arrive as a formed chunk that survives the simmer",
    },
    {
      label: "Does not dissolve away",
      alternatives: [
        { property: "solubility", maxLevel: 1 },
        { property: "emulsification", minLevel: 2 },
      ],
      reason:
        "over a long simmer a highly soluble protein disappears into the sauce; acceptable only when it is the stew's emulsifier (emulsification High)",
    },
  ],
  wrap: [
    {
      label: "Filling is not dry",
      alternatives: [{ property: "waterHolding", minLevel: 1 }],
      reason:
        "a wrap has no sauce bath to rescue a dry filling — water-holding of at least Moderate keeps every bite moist",
    },
    {
      label: "Slices and stays in the wrap",
      alternatives: [
        { property: "gelation", minLevel: 1 },
        { property: "waterHolding", minLevel: 2 },
      ],
      reason:
        "wrap fillings are cut into strips and folded — the protein must be a set gel that slices, or a formed water-holding chunk, not a crumble or a liquid",
    },
  ],
  raw: [
    {
      label: "Disperses without cooking",
      alternatives: [{ property: "solubility", minLevel: 1 }],
      reason:
        "raw preparations (dressings, marinades, drinks) have no heat to set or soften anything — the protein must disperse or dissolve as it is",
    },
  ],
};

export interface SurvivalResult {
  survives: boolean;
  /** One line per requirement: what was tested, the outcome, and why. */
  reasons: string[];
}

function describeThreshold(t: PropertyThreshold): string {
  const label = PROPERTY_LABEL[t.property];
  if (t.maxLevel !== undefined && t.minLevel === undefined) {
    return `${label} ≤ ${LEVEL_NAME[t.maxLevel]}`;
  }
  return `${label} ≥ ${LEVEL_NAME[t.minLevel ?? 0]}`;
}

/**
 * Predict whether a protein's functional profile survives a cooking
 * method. Rule-based screening over qualitative descriptors — see the
 * header comment for the honest scope of this model.
 */
export function predictSurvival(
  protein: ProteinEntry,
  method: CookingMethod,
): SurvivalResult {
  const requirements = METHOD_REQUIREMENTS[method];
  const reasons: string[] = [];
  let survives = true;

  for (const req of requirements) {
    const met = req.alternatives.find((alt) => {
      const level = LEVEL_NUM[protein.functional[alt.property]];
      return (
        level >= (alt.minLevel ?? 0) && level <= (alt.maxLevel ?? 2)
      );
    });
    if (met) {
      const level = protein.functional[met.property];
      reasons.push(
        `${req.label}: ${PROPERTY_LABEL[met.property]} is ${level} — ${req.reason}.`,
      );
    } else {
      survives = false;
      const needed = req.alternatives.map(describeThreshold).join(" or ");
      const actual = req.alternatives
        .map((a) => `${PROPERTY_LABEL[a.property]} ${protein.functional[a.property]}`)
        .join(", ");
      reasons.push(
        `${req.label}: FAILED — needs ${needed}, because ${req.reason}; this protein has ${actual}.`,
      );
    }
  }

  return { survives, reasons };
}

/** The functional properties a method's requirements actually test. */
function methodFocusProperties(method: CookingMethod): (keyof FunctionalProfile)[] {
  const seen = new Set<keyof FunctionalProfile>();
  for (const req of METHOD_REQUIREMENTS[method]) {
    for (const alt of req.alternatives) seen.add(alt.property);
  }
  return [...seen];
}

function functionalFit(protein: ProteinEntry, method: CookingMethod): number {
  const focus = methodFocusProperties(method);
  const vals = focus.map((k) => LEVEL_NUM[protein.functional[k]] / 2);
  return vals.reduce((s, v) => s + v, 0) / vals.length;
}

/* -------------------------------------------------------------- familiarity */

/**
 * How established each plant protein already is in Nigerian kitchens, as
 * the LEAD protein of a dish (0–1). Modelled team judgement, recorded as
 * data with reasons — a familiarity prior, not a measurement.
 */
export const FAMILIARITY: Record<string, { score: number; note: string }> = {
  egusi: {
    score: 1.0,
    note: "already the protein base of a national soup — no introduction needed",
  },
  "soy-chunks": {
    score: 0.9,
    note: "TVP is the established meat substitute in Nigerian restaurants (Veggie Victory's Vchunks is the same idea)",
  },
  awara: {
    score: 0.9,
    note: "awara is a familiar street food across the north and west",
  },
  bambara: {
    score: 0.7,
    note: "beloved regionally (okpa in the east, danwake in the north), less known elsewhere as a lead protein",
  },
  mushrooms: {
    score: 0.6,
    note: "familiar as a vegetable and flavour, less established as the protein of a dish",
  },
  "soy-milk": {
    score: 0.5,
    note: "known in cities as a drink and sauce base, less so in traditional kitchens",
  },
  dawadawa: {
    score: 0.4,
    note: "universally known — but as a seasoning; unusual as the main protein",
  },
  seitan: {
    score: 0.4,
    note: "arriving via vegan restaurants and imported vital wheat gluten; still new to most Nigerian kitchens — and it IS gluten, so it is excluded wherever wheat is",
  },
};

/* ---------------------------------------------------------------- prep model */

/** Modelled base preparation time per method, minutes. */
const METHOD_PREP_MINUTES: Record<CookingMethod, number> = {
  grill: 30,
  fry: 20,
  boil: 15,
  soup: 40,
  stew: 35,
  wrap: 20,
  raw: 5,
};

/** Modelled per-protein prep adjustments, minutes (see header). */
const PREP_DELTA_BY_PROTEIN: Record<string, number> = {
  "soy-chunks": 10, // rehydrate the dry chunks
  awara: 5, // press the curd
  egusi: 10, // grind the seed
  bambara: 20, // hard legume — long boil to soften
  mushrooms: -5, // no prep beyond cleaning
  seitan: 30, // make from vital wheat gluten: knead, rest, simmer — ≈60 min total on the grill path (estimate; the flour-wash route takes longer)
};

function prepMinutesFor(protein: ProteinEntry, method: CookingMethod): number {
  return METHOD_PREP_MINUTES[method] + (PREP_DELTA_BY_PROTEIN[protein.id] ?? 0);
}

/* ------------------------------------------------------------------- types */

export interface TransformOpts {
  /** Absolute per-serving cap. Default: the cost of the protein replaced. */
  budgetCapNgn?: number;
  /** Transformed protein must be ≥ this fraction of the original. Default 0.9. */
  minProteinRatio?: number;
  /** Optional hard limit on modelled prep time. */
  maxPrepMinutes?: number;
  /** Allergen labels or synonyms to exclude (canonicalised). */
  avoidAllergens?: string[];
}

export interface OriginalSummary {
  proteinId: string;
  proteinName: string;
  portionG: number;
  costNgn: number;
  proteinG: number;
  priceBasis: string;
  priceDerived: boolean;
  source: string;
}

export interface TransformCandidate {
  id: string;
  proteinId: string;
  proteinName: string;
  portionG: number;
  costNgn: number;
  proteinG: number;
  /** Candidate protein as a fraction of the original protein (1 = equal). */
  proteinRatio: number;
  prepMinutes: number;
  score: number;
  scoreParts: {
    cost: number;
    protein: number;
    functionalFit: number;
    familiarity: number;
  };
  functionalFit: number;
  /** Level of each property the dish's method actually tests. */
  functionalFocus: { property: keyof FunctionalProfile; level: FunctionalLevel }[];
  functional: FunctionalProfile;
  /** The method-survival reasoning for this protein (all requirements met). */
  survivalReasons: string[];
  familiarity: number;
  familiarityNote: string;
  whyItWorks: string;
  allergens: string[];
  priceBasis: string;
  priceDerived: boolean;
  source: string;
  kitchenMeaning: string;
}

export type RejectReason =
  | "allergen"
  | "method-survival"
  | "protein-floor"
  | "budget"
  | "prep-time";

export interface RejectedExample {
  id: string;
  reason: RejectReason;
  detail: string;
}

export interface TransformResult {
  dish: TransformableDish;
  original: OriginalSummary;
  /** The budget cap in force for this run, and where it came from. */
  capNgn: number;
  capSource: "default-original-cost" | "caller";
  /** Base components are not priced in the verified dataset — see header. */
  costModel: "protein-only";
  minProteinRatio: number;
  proteinFloorG: number;
  inspected: number;
  best: TransformCandidate | null;
  alternatives: TransformCandidate[];
  /** Up to 5 examples (first example of each failing reason first). */
  rejected: RejectedExample[];
  rejectedCounts: Record<RejectReason, number>;
  /** Cheapest candidate rejected ONLY by the budget — set when best is null. */
  nearMiss: { id: string; costNgn: number; proteinG: number; overByNgn: number } | null;
  /** The visible reasoning, line by line. */
  trace: string[];
}

/* -------------------------------------------------------------- validation */

const REJECT_REASONS: RejectReason[] = [
  "allergen",
  "method-survival",
  "protein-floor",
  "budget",
  "prep-time",
];

function resolveOpts(
  opts: TransformOpts,
): TransformOpts & { minProteinRatio: number; avoidAllergens: string[] } {
  const minProteinRatio = opts.minProteinRatio ?? 0.9;
  if (
    typeof minProteinRatio !== "number" ||
    !Number.isFinite(minProteinRatio) ||
    !(minProteinRatio > 0) ||
    minProteinRatio > 2
  ) {
    throw new Error("minProteinRatio must be a number greater than 0 and at most 2");
  }
  if (opts.budgetCapNgn !== undefined) {
    if (
      typeof opts.budgetCapNgn !== "number" ||
      !Number.isFinite(opts.budgetCapNgn) ||
      !(opts.budgetCapNgn > 0)
    ) {
      throw new Error("budgetCapNgn must be a number greater than 0");
    }
  }
  if (opts.maxPrepMinutes !== undefined) {
    if (
      typeof opts.maxPrepMinutes !== "number" ||
      !Number.isFinite(opts.maxPrepMinutes) ||
      !(opts.maxPrepMinutes > 0)
    ) {
      throw new Error("maxPrepMinutes must be a number greater than 0");
    }
  }
  const avoid = new Set<string>();
  for (const a of opts.avoidAllergens ?? []) {
    if (typeof a !== "string") {
      throw new Error("avoidAllergens must be an array of strings");
    }
    const c = canonicalAllergen(a);
    if (c === null) {
      throw new Error(
        `Unsupported allergen exclusion: "${a}". Supported exclusions: peanut (groundnut), soy (soya), gluten (wheat) — an exclusion we cannot verify is never silently ignored.`,
      );
    }
    avoid.add(c);
  }
  return {
    budgetCapNgn: opts.budgetCapNgn,
    minProteinRatio,
    maxPrepMinutes: opts.maxPrepMinutes,
    avoidAllergens: [...avoid],
  };
}

/* -------------------------------------------------------------- transform */

export function transformDish(
  dish: TransformableDish,
  opts: TransformOpts = {},
): TransformResult {
  const resolved = resolveOpts(opts);
  const avoid = new Set(resolved.avoidAllergens);

  const current = PROTEIN_BY_ID.get(dish.currentProteinId);
  if (!current) {
    throw new Error(`Unknown current protein: ${dish.currentProteinId}`);
  }
  const originalProteinG = (current.proteinGPer100g * dish.currentPortionG) / 100;
  const originalCost = (current.priceNgnPerKg * dish.currentPortionG) / 1000;
  const floor = resolved.minProteinRatio * originalProteinG;
  const cap = resolved.budgetCapNgn ?? originalCost;

  const baseComponents = dish.baseComponentIds.map((id) => {
    const ing = INGREDIENT_BY_ID.get(id);
    if (!ing) throw new Error(`Unknown base ingredient on dish ${dish.dishId}: ${id}`);
    return ing;
  });
  // Base-component allergen conflicts apply to EVERY candidate: the base
  // is part of the dish as composed, and we never strip it silently.
  const baseConflicts = baseComponents
    .map((ing) => ({ ing, hits: [...canonicalSet(ing.allergens)].filter((a) => avoid.has(a)) }))
    .filter((x) => x.hits.length > 0);

  const rejectedCounts: Record<RejectReason, number> = {
    allergen: 0,
    "method-survival": 0,
    "protein-floor": 0,
    budget: 0,
    "prep-time": 0,
  };
  const rejectedAll: RejectedExample[] = [];
  const survivors: TransformCandidate[] = [];
  let cheapestBudgetOnlyMiss: { id: string; costNgn: number; proteinG: number } | null = null;
  let inspected = 0;

  const reject = (id: string, reason: RejectReason, detail: string) => {
    rejectedCounts[reason] += 1;
    rejectedAll.push({ id, reason, detail });
  };

  for (const protein of PLANT_PROTEINS) {
    const survival = predictSurvival(protein, dish.cookingMethod);
    const proteinAllergens = canonicalSet(protein.allergens);
    for (const portionG of PORTIONS_G) {
      inspected += 1;
      const id = `${protein.id}@${portionG}g`;
      const cost = (protein.priceNgnPerKg * portionG) / 1000;
      const proteinG = (protein.proteinGPer100g * portionG) / 100;
      const prep = prepMinutesFor(protein, dish.cookingMethod);

      // Gate 1 — allergen (fail closed: protein's own, then the base's).
      const ownHit = [...proteinAllergens].filter((a) => avoid.has(a));
      if (ownHit.length > 0) {
        reject(id, "allergen", `${protein.name} itself carries the excluded allergen: ${ownHit.join(", ")}`);
        continue;
      }
      if (baseConflicts.length > 0) {
        const c = baseConflicts[0];
        reject(
          id,
          "allergen",
          `the dish base includes ${c.ing.name}, which carries the excluded allergen (${c.hits.join(", ")}) — the base is never stripped silently`,
        );
        continue;
      }
      // Gate 2 — method survival.
      if (!survival.survives) {
        const failed = survival.reasons.find((r) => r.includes("FAILED")) ?? survival.reasons[0];
        reject(id, "method-survival", failed);
        continue;
      }
      // Gate 3 — protein floor.
      if (proteinG + 1e-9 < floor) {
        reject(
          id,
          "protein-floor",
          `${fmtG(proteinG)} protein is below the ${fmtG(floor)} floor (${Math.round(resolved.minProteinRatio * 100)}% of the original ${fmtG(originalProteinG)})`,
        );
        continue;
      }
      // Gate 4 — budget.
      if (cost > cap + 1e-9) {
        reject(id, "budget", `${fmtNgn(cost)} exceeds the ${fmtNgn(cap)} cap`);
        // Track the cheapest candidate that failed ONLY here (prep is
        // checked after budget, so also confirm it would pass prep).
        if (
          (resolved.maxPrepMinutes === undefined || prep <= resolved.maxPrepMinutes) &&
          (cheapestBudgetOnlyMiss === null || cost < cheapestBudgetOnlyMiss.costNgn)
        ) {
          cheapestBudgetOnlyMiss = { id, costNgn: round2(cost), proteinG: round2(proteinG) };
        }
        continue;
      }
      // Gate 5 — prep time (only when the caller set a limit).
      if (resolved.maxPrepMinutes !== undefined && prep > resolved.maxPrepMinutes) {
        reject(id, "prep-time", `${prep} min modelled prep exceeds the ${resolved.maxPrepMinutes} min limit`);
        continue;
      }

      // Survivor — score it.
      const fit = functionalFit(protein, dish.cookingMethod);
      const fam = FAMILIARITY[protein.id] ?? { score: 0.5, note: "no familiarity prior recorded" };
      const parts = {
        cost: round4(0.35 * Math.max(0, 1 - cost / cap)),
        protein: round4(0.25 * (proteinG / (proteinG + originalProteinG))),
        functionalFit: round4(0.25 * fit),
        familiarity: round4(0.15 * fam.score),
      };
      const score = round4(parts.cost + parts.protein + parts.functionalFit + parts.familiarity);
      const focus = methodFocusProperties(dish.cookingMethod);
      const strongProps = focus
        .filter((k) => protein.functional[k] !== "Low")
        .map((k) => `${PROPERTY_LABEL[k]} ${protein.functional[k]}`);
      const deltaPct = ((cost - originalCost) / originalCost) * 100;
      const whyItWorks =
        `${protein.kitchenMeaning} For ${dish.cookingMethod} it brings ${strongProps.join(", ")}. ` +
        `At ${fmtNgn(cost)} for ${portionG} g it is ${deltaPct <= 0 ? `${Math.abs(Math.round(deltaPct))}% cheaper than` : `${Math.round(deltaPct)}% above`} ` +
        `the ${fmtNgn(originalCost)} of the ${current.name} it replaces, while keeping ${Math.round((proteinG / originalProteinG) * 100)}% of the protein.`;

      survivors.push({
        id,
        proteinId: protein.id,
        proteinName: protein.name,
        portionG,
        costNgn: round2(cost),
        proteinG: round2(proteinG),
        proteinRatio: round4(proteinG / originalProteinG),
        prepMinutes: prep,
        score,
        scoreParts: parts,
        functionalFit: round4(fit),
        functionalFocus: focus.map((k) => ({ property: k, level: protein.functional[k] })),
        functional: protein.functional,
        survivalReasons: survival.reasons,
        familiarity: fam.score,
        familiarityNote: fam.note,
        whyItWorks,
        allergens: [...proteinAllergens].sort(),
        priceBasis: protein.priceBasis,
        priceDerived: isDerivedPrice(protein),
        source: protein.source,
        kitchenMeaning: protein.kitchenMeaning,
      });
    }
  }

  survivors.sort((a, b) => b.score - a.score || a.costNgn - b.costNgn);
  const best = survivors[0] ?? null;
  const alternatives = survivors.slice(1, 4);

  // Rejected examples: first example of each reason, then fill to 5.
  const examples: RejectedExample[] = [];
  for (const reason of REJECT_REASONS) {
    const first = rejectedAll.find((r) => r.reason === reason);
    if (first) examples.push(first);
  }
  for (const r of rejectedAll) {
    if (examples.length >= 5) break;
    if (!examples.includes(r)) examples.push(r);
  }

  const nearMiss =
    best === null && cheapestBudgetOnlyMiss !== null
      ? {
          id: cheapestBudgetOnlyMiss.id,
          costNgn: cheapestBudgetOnlyMiss.costNgn,
          proteinG: cheapestBudgetOnlyMiss.proteinG,
          overByNgn: round2(cheapestBudgetOnlyMiss.costNgn - cap),
        }
      : null;

  /* ------------------------------------------------------------ the trace */
  const trace: string[] = [];
  trace.push(
    `Original: ${current.name} ${dish.currentPortionG} g = ${fmtG(originalProteinG)} protein, ${fmtNgn(originalCost)} (${shortBasis(current)}).`,
  );
  trace.push(
    `Protein floor: the swap must keep ≥ ${Math.round(resolved.minProteinRatio * 100)}% of the original protein = ≥ ${fmtG(floor)}, at the candidate's own portion.`,
  );
  trace.push(
    resolved.budgetCapNgn !== undefined
      ? `Budget cap: ${fmtNgn(cap)} per serving (set by the caller). Costs are protein-only — base components are allergen-checked but not priced, because the verified dataset carries no prices for them.`
      : `Budget cap: ${fmtNgn(cap)} per serving — the cost of the ${current.name} being replaced, so the swap may not cost more than what it replaces. Costs are protein-only — base components are allergen-checked but not priced, because the verified dataset carries no prices for them.`,
  );
  if (avoid.size > 0) {
    trace.push(
      `Allergen exclusions (fail closed): ${[...avoid].join(", ")} — checked against every candidate protein and against the dish base (${baseComponents.map((b) => b.name).join(", ") || "no base components"}).`,
    );
  }
  if (dish.note) trace.push(`Dish note: ${dish.note}`);
  trace.push(
    `Method survival (${dish.cookingMethod}): each protein's functional profile was screened against the ${dish.cookingMethod} requirements — a rule-based prediction over qualitative descriptors, not a lab simulation.`,
  );
  trace.push(
    `Evaluated ${inspected} formulations (${PLANT_PROTEINS.length} plant proteins × ${PORTIONS_G.length} portions): rejected — allergen ${rejectedCounts.allergen}, method-survival ${rejectedCounts["method-survival"]}, protein-floor ${rejectedCounts["protein-floor"]}, budget ${rejectedCounts.budget}, prep-time ${rejectedCounts["prep-time"]}; survived ${survivors.length}.`,
  );
  for (const ex of examples.slice(0, 3)) {
    trace.push(`Rejected ${ex.id}: ${ex.detail.replace(/\.+$/, "")}.`);
  }
  if (best) {
    const deltaPct = ((best.costNgn - originalCost) / originalCost) * 100;
    trace.push(
      `Winner: ${best.proteinName} @${best.portionG} g — ${fmtNgn(best.costNgn)} (${deltaPct <= 0 ? `${Math.abs(Math.round(deltaPct))}% cheaper than` : `${Math.round(deltaPct)}% above`} the original ${fmtNgn(originalCost)}), ${fmtG(best.proteinG)} protein (${Math.round(best.proteinRatio * 100)}% of the original), score ${best.score} (cost ${best.scoreParts.cost} / protein ${best.scoreParts.protein} / functional fit ${best.scoreParts.functionalFit} / familiarity ${best.scoreParts.familiarity}).`,
    );
    if (alternatives.length > 0) {
      trace.push(
        `Also eligible: ${alternatives.map((a) => `${a.proteinName} @${a.portionG} g (${fmtNgn(a.costNgn)}, ${fmtG(a.proteinG)}, score ${a.score})`).join("; ")}.`,
      );
    }
  } else if (nearMiss) {
    trace.push(
      `No survivor at the ${fmtNgn(cap)} cap — the cap was NOT relaxed. Cheapest near-miss: ${nearMiss.id} at ${fmtNgn(nearMiss.costNgn)}, only ${fmtNgn(nearMiss.overByNgn)} over the cap, with ${fmtG(nearMiss.proteinG)} protein. Raising the cap to ${fmtNgn(nearMiss.costNgn)} would admit it.`,
    );
  } else {
    trace.push(
      `No survivor, and no near-miss: every formulation failed allergen, method-survival, protein or prep-time gates before budget was even considered. The constraints were not relaxed.`,
    );
  }

  return {
    dish,
    original: {
      proteinId: current.id,
      proteinName: current.name,
      portionG: dish.currentPortionG,
      costNgn: round2(originalCost),
      proteinG: round2(originalProteinG),
      priceBasis: current.priceBasis,
      priceDerived: isDerivedPrice(current),
      source: current.source,
    },
    capNgn: round2(cap),
    capSource: resolved.budgetCapNgn !== undefined ? "caller" : "default-original-cost",
    costModel: "protein-only",
    minProteinRatio: resolved.minProteinRatio,
    proteinFloorG: round2(floor),
    inspected,
    best,
    alternatives,
    rejected: examples,
    rejectedCounts,
    nearMiss,
    trace,
  };
}

/* ------------------------------------------------------------ whole menu */

export interface MenuTransformResult {
  results: TransformResult[];
  aggregates: {
    dishesTransformed: number;
    dishesWithSurvivor: number;
    /** Median over dishes WITH a survivor; null when none survived. */
    medianCostDeltaPct: number | null;
    medianProteinDeltaPct: number | null;
    rejectedByReason: Record<RejectReason, number>;
  };
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function transformMenu(
  dishes: TransformableDish[],
  opts: TransformOpts = {},
): MenuTransformResult {
  const results = dishes.map((d) => transformDish(d, opts));
  const costDeltas: number[] = [];
  const proteinDeltas: number[] = [];
  const rejectedByReason: Record<RejectReason, number> = {
    allergen: 0,
    "method-survival": 0,
    "protein-floor": 0,
    budget: 0,
    "prep-time": 0,
  };
  for (const r of results) {
    for (const reason of REJECT_REASONS) rejectedByReason[reason] += r.rejectedCounts[reason];
    if (r.best) {
      costDeltas.push(((r.best.costNgn - r.original.costNgn) / r.original.costNgn) * 100);
      proteinDeltas.push(((r.best.proteinG - r.original.proteinG) / r.original.proteinG) * 100);
    }
  }
  return {
    results,
    aggregates: {
      dishesTransformed: results.length,
      dishesWithSurvivor: results.filter((r) => r.best !== null).length,
      medianCostDeltaPct: median(costDeltas) === null ? null : round2(median(costDeltas) as number),
      medianProteinDeltaPct:
        median(proteinDeltas) === null ? null : round2(median(proteinDeltas) as number),
      rejectedByReason,
    },
  };
}

/* --------------------------------------------------------- request parsing */

const TRANSFORM_FIELDS = new Set([
  "dishId",
  "dish",
  "budgetCapNgn",
  "minProteinRatio",
  "maxPrepMinutes",
  "avoidAllergens",
]);
const MENU_FIELDS = new Set([
  "budgetCapNgn",
  "minProteinRatio",
  "maxPrepMinutes",
  "avoidAllergens",
]);

function parseOpts(raw: Record<string, unknown>): TransformOpts {
  const opts: TransformOpts = {};
  if (raw.budgetCapNgn !== undefined) {
    if (typeof raw.budgetCapNgn !== "number" || !Number.isFinite(raw.budgetCapNgn)) {
      throw new Error("budgetCapNgn must be a finite number");
    }
    opts.budgetCapNgn = raw.budgetCapNgn;
  }
  if (raw.minProteinRatio !== undefined) {
    if (typeof raw.minProteinRatio !== "number" || !Number.isFinite(raw.minProteinRatio)) {
      throw new Error("minProteinRatio must be a finite number");
    }
    opts.minProteinRatio = raw.minProteinRatio;
  }
  if (raw.maxPrepMinutes !== undefined) {
    if (typeof raw.maxPrepMinutes !== "number" || !Number.isFinite(raw.maxPrepMinutes)) {
      throw new Error("maxPrepMinutes must be a finite number");
    }
    opts.maxPrepMinutes = raw.maxPrepMinutes;
  }
  if (raw.avoidAllergens !== undefined) {
    if (
      !Array.isArray(raw.avoidAllergens) ||
      raw.avoidAllergens.some((a) => typeof a !== "string")
    ) {
      throw new Error("avoidAllergens must be an array of strings");
    }
    opts.avoidAllergens = raw.avoidAllergens as string[];
  }
  // Range + canonicalisation checks live in resolveOpts (throws clearly).
  resolveOpts(opts);
  return opts;
}

function requireObject(body: unknown): Record<string, unknown> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new Error("Request body must be a JSON object");
  }
  return body as Record<string, unknown>;
}

/** Parse a POST /api/transform body into a dish + opts. Throws → 400. */
export function parseTransformRequest(body: unknown): {
  dish: TransformableDish;
  opts: TransformOpts;
} {
  const raw = requireObject(body);
  for (const key of Object.keys(raw)) {
    if (!TRANSFORM_FIELDS.has(key)) {
      throw new Error(`Unknown request field: ${key}`);
    }
  }
  const hasId = raw.dishId !== undefined;
  const hasDish = raw.dish !== undefined;
  if (hasId === hasDish) {
    throw new Error("Provide exactly one of dishId or dish");
  }
  let dish: TransformableDish;
  if (hasId) {
    if (typeof raw.dishId !== "string") throw new Error("dishId must be a string");
    const found = TRANSFORMABLE_DISHES.find((d) => d.dishId === raw.dishId);
    if (!found) {
      throw new Error(
        `Unknown dishId: "${raw.dishId}". Known dishes: ${TRANSFORMABLE_DISHES.map((d) => d.dishId).join(", ")}`,
      );
    }
    dish = found;
  } else {
    dish = dishFromUserInput(raw.dish as UserDishInput);
  }
  return { dish, opts: parseOpts(raw) };
}

/** Parse a POST /api/transform-menu body into opts. Throws → 400. */
export function parseTransformMenuRequest(body: unknown): TransformOpts {
  const raw = requireObject(body);
  for (const key of Object.keys(raw)) {
    if (!MENU_FIELDS.has(key)) {
      throw new Error(`Unknown request field: ${key}`);
    }
  }
  return parseOpts(raw);
}
