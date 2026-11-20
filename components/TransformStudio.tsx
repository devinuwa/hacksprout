"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Transform Studio — engine v2 UI.
 *
 * Talks ONLY to POST /api/transform (and POST /api/transform-menu for the
 * dish list). The types below mirror the API response shapes from
 * lib/transform.ts; nothing from lib/ is imported into this component.
 */

type FunctionalLevel = "Low" | "Moderate" | "High";

interface FunctionalProfile {
  solubility: FunctionalLevel;
  waterHolding: FunctionalLevel;
  emulsification: FunctionalLevel;
  gelation: FunctionalLevel;
}

interface OriginalSummary {
  proteinId: string;
  proteinName: string;
  portionG: number;
  costNgn: number;
  proteinG: number;
  priceBasis: string;
  priceDerived: boolean;
  source: string;
}

interface TransformCandidate {
  id: string;
  proteinId: string;
  proteinName: string;
  portionG: number;
  costNgn: number;
  proteinG: number;
  proteinRatio: number;
  prepMinutes: number;
  score: number;
  scoreParts: {
    cost: number;
    protein: number;
    functionalFit: number;
    familiarity: number;
  };
  functionalFocus: { property: keyof FunctionalProfile; level: FunctionalLevel }[];
  functional: FunctionalProfile;
  survivalReasons: string[];
  familiarityNote: string;
  whyItWorks: string;
  allergens: string[];
  priceBasis: string;
  priceDerived: boolean;
  source: string;
  kitchenMeaning: string;
}

type RejectReason =
  | "allergen"
  | "method-survival"
  | "protein-floor"
  | "budget"
  | "prep-time";

interface TransformResult {
  dish: {
    dishId: string;
    name: string;
    cookingMethod: string;
    sellingPriceNgn: number;
    note?: string;
  };
  original: OriginalSummary;
  capNgn: number;
  capSource: "default-original-cost" | "caller";
  costModel: "protein-only";
  minProteinRatio: number;
  proteinFloorG: number;
  inspected: number;
  best: TransformCandidate | null;
  alternatives: TransformCandidate[];
  rejected: { id: string; reason: RejectReason; detail: string }[];
  rejectedCounts: Record<RejectReason, number>;
  nearMiss: { id: string; costNgn: number; proteinG: number; overByNgn: number } | null;
  trace: string[];
}

interface DishOption {
  dishId: string;
  name: string;
  cookingMethod: string;
  sellingPriceNgn: number;
}

/** Fallback picker list (mirrors lib/dishes.ts) if the API is unreachable. */
const FALLBACK_DISHES: DishOption[] = [
  { dishId: "kebab-skewers", name: "Kebab Skewers", cookingMethod: "grill", sellingPriceNgn: 2000 },
  { dishId: "shawarma-wrap", name: "Shawarma Wrap", cookingMethod: "wrap", sellingPriceNgn: 4500 },
  { dishId: "jollof-chicken-side", name: "Jollof Rice with Chicken Side", cookingMethod: "fry", sellingPriceNgn: 8500 },
  { dishId: "egusi-soup", name: "Egusi Soup", cookingMethod: "soup", sellingPriceNgn: 8500 },
  { dishId: "efo-riro", name: "Efo Riro", cookingMethod: "stew", sellingPriceNgn: 8500 },
  { dishId: "edikang-ikong", name: "Edikang Ikong Soup", cookingMethod: "soup", sellingPriceNgn: 8500 },
  { dishId: "nkwobi", name: "Nkwobi", cookingMethod: "stew", sellingPriceNgn: 6000 },
  { dishId: "asun", name: "Asun", cookingMethod: "grill", sellingPriceNgn: 6000 },
  { dishId: "vurger", name: "Vurger", cookingMethod: "fry", sellingPriceNgn: 10000 },
  { dishId: "ofada-rice", name: "Ofada Rice & Sauce", cookingMethod: "stew", sellingPriceNgn: 9000 },
  { dishId: "tofu-scramble", name: "Tofu Scramble Breakfast", cookingMethod: "fry", sellingPriceNgn: 8000 },
  { dishId: "creamy-egusi-pasta", name: "Creamy Egusi Pasta", cookingMethod: "boil", sellingPriceNgn: 10000 },
];

const PROTEIN_OPTIONS: { id: string; label: string }[] = [
  { id: "beef", label: "Beef (animal — the usual original)" },
  { id: "chicken", label: "Chicken (animal — the usual original)" },
  { id: "soy-chunks", label: "Soy chunks (TVP)" },
  { id: "awara", label: "Awara (soy curd / tofu)" },
  { id: "soy-milk", label: "Soy milk base" },
  { id: "egusi", label: "Egusi (melon seed)" },
  { id: "bambara", label: "Bambara groundnut" },
  { id: "mushrooms", label: "Mushrooms" },
  { id: "dawadawa", label: "Dawadawa (locust bean)" },
];

const METHOD_OPTIONS: { id: string; label: string }[] = [
  { id: "grill", label: "Grill" },
  { id: "fry", label: "Fry" },
  { id: "boil", label: "Boil" },
  { id: "soup", label: "Soup" },
  { id: "stew", label: "Stew" },
  { id: "wrap", label: "Wrap" },
  { id: "raw", label: "Raw (no cooking)" },
];

const ALLERGEN_OPTIONS: { id: string; label: string }[] = [
  { id: "peanut", label: "No peanut (incl. groundnut)" },
  { id: "soy", label: "No soy (soya)" },
  { id: "gluten", label: "No gluten (wheat)" },
];

const REJECT_LABELS: Record<RejectReason, string> = {
  allergen: "Allergen",
  "method-survival": "Method survival",
  "protein-floor": "Protein floor",
  budget: "Budget",
  "prep-time": "Prep time",
};

const fmtNgn = (n: number) =>
  `₦${n.toLocaleString("en-NG", {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
const fmtG = (n: number) => `${Math.round(n * 10) / 10} g`;
const signedNgn = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${fmtNgn(Math.abs(n))}`;
const signedPct = (p: number) =>
  `${p > 0 ? "+" : p < 0 ? "−" : ""}${Math.abs(p).toFixed(1)}%`;
const signedG = (n: number) =>
  `${n > 0 ? "+" : n < 0 ? "−" : ""}${fmtG(Math.abs(n))}`;

async function postTransform(body: unknown): Promise<TransformResult> {
  const res = await fetch("/api/transform", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const msg =
      data && typeof data === "object" && "error" in data
        ? String((data as { error: unknown }).error)
        : `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data as TransformResult;
}

export default function TransformStudio() {
  const [mode, setMode] = useState<"menu" | "custom">("menu");
  const [dishes, setDishes] = useState<DishOption[]>(FALLBACK_DISHES);
  const [dishId, setDishId] = useState("kebab-skewers");

  // "Your own dish" fields
  const [dishName, setDishName] = useState("My pepper chicken");
  const [currentProteinId, setCurrentProteinId] = useState("chicken");
  const [portionG, setPortionG] = useState(100);
  const [cookingMethod, setCookingMethod] = useState("fry");
  const [sellingPrice, setSellingPrice] = useState(5000);

  // Shared constraint options
  const [avoidAllergens, setAvoidAllergens] = useState<string[]>([]);
  const [floorPct, setFloorPct] = useState(90);
  const [budgetCap, setBudgetCap] = useState("");

  const [result, setResult] = useState<TransformResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Dish list from the API (transform-menu returns every dish embedded in
  // its results). Falls back to the hard-coded list if the call fails.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/transform-menu", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          results?: { dish: DishOption }[];
        };
        const list = (data.results ?? []).map((r) => r.dish);
        if (!cancelled && list.length > 0) setDishes(list);
      } catch {
        /* fallback list already in state */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const buildOpts = useCallback(() => {
    const opts: Record<string, unknown> = { minProteinRatio: floorPct / 100 };
    if (avoidAllergens.length > 0) opts.avoidAllergens = avoidAllergens;
    const cap = Number(budgetCap);
    if (budgetCap.trim() !== "" && Number.isFinite(cap) && cap > 0) {
      opts.budgetCapNgn = cap;
    }
    return opts;
  }, [avoidAllergens, floorPct, budgetCap]);

  const runBody = useCallback(
    async (body: unknown) => {
      setLoading(true);
      setError(null);
      try {
        setResult(await postTransform(body));
      } catch (err) {
        setResult(null);
        setError(err instanceof Error ? err.message : "Transform request failed");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Menu mode re-runs whenever the dish or the shared options change
  // (same behaviour as the v1 Kitchen Studio).
  useEffect(() => {
    if (mode !== "menu") return;
    void runBody({ dishId, ...buildOpts() });
  }, [mode, dishId, buildOpts, runBody]);

  const toggleAllergen = (id: string) =>
    setAvoidAllergens((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    );

  const runCustom = () => {
    void runBody({
      dish: {
        name: dishName,
        currentProteinId,
        currentPortionG: portionG,
        cookingMethod,
        sellingPriceNgn: sellingPrice,
      },
      ...buildOpts(),
    });
  };

  const best = result?.best ?? null;
  const original = result?.original ?? null;
  const costDelta = best && original ? best.costNgn - original.costNgn : 0;
  const costDeltaPct =
    best && original && original.costNgn > 0
      ? (costDelta / original.costNgn) * 100
      : 0;
  const proteinDelta = best && original ? best.proteinG - original.proteinG : 0;
  const proteinDeltaPct =
    best && original && original.proteinG > 0
      ? (proteinDelta / original.proteinG) * 100
      : 0;

  return (
    <section id="transform" className="hs-section">
      <h2 className="hs-section-title">Transform Studio</h2>
      <p className="hs-section-lede">
        The Challenge 2 core flow: take an <strong>existing menu item</strong> —
        yours or one from the menu — and get a credible plant-based
        transformation of its protein, with the reasoning visible. Not a recipe
        generator: the swap is screened against hard gates first, and every
        number comes from the verified catalogue.
      </p>

      <div className="tv-tabs" role="tablist" aria-label="Dish source">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "menu"}
          className={`tv-tab${mode === "menu" ? " tv-tab--active" : ""}`}
          onClick={() => setMode("menu")}
        >
          Pick a menu dish
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "custom"}
          className={`tv-tab${mode === "custom" ? " tv-tab--active" : ""}`}
          onClick={() => setMode("custom")}
        >
          Your own dish
        </button>
      </div>

      <div className="hs-layout">
        <div className="hs-panel">
          {mode === "menu" ? (
            <>
              <h3 className="hs-panel-title">Menu dish to transform</h3>
              <label className="hs-field">
                <span className="hs-label">Existing menu item</span>
                <select
                  value={dishId}
                  onChange={(e) => setDishId(e.target.value)}
                >
                  {dishes.map((d) => (
                    <option key={d.dishId} value={d.dishId}>
                      {d.name} — {d.cookingMethod} · sells {fmtNgn(d.sellingPriceNgn)}
                    </option>
                  ))}
                </select>
              </label>
              <p className="hs-note">
                The benchmark is the animal protein this dish traditionally
                replaces, at the portion the dish is composed with today.
              </p>
            </>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                runCustom();
              }}
            >
              <h3 className="hs-panel-title">Your own dish</h3>
              <label className="hs-field">
                <span className="hs-label">Dish name</span>
                <input
                  type="text"
                  value={dishName}
                  maxLength={120}
                  onChange={(e) => setDishName(e.target.value)}
                  required
                />
              </label>
              <label className="hs-field">
                <span className="hs-label">Current protein in the dish</span>
                <select
                  value={currentProteinId}
                  onChange={(e) => setCurrentProteinId(e.target.value)}
                >
                  {PROTEIN_OPTIONS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="hs-grid2">
                <label className="hs-field">
                  <span className="hs-label">
                    Portion of that protein — <span className="num">{portionG} g</span>
                  </span>
                  <input
                    type="number"
                    min={20}
                    max={500}
                    value={portionG}
                    onChange={(e) => setPortionG(Number(e.target.value))}
                  />
                </label>
                <label className="hs-field">
                  <span className="hs-label">Cooking method</span>
                  <select
                    value={cookingMethod}
                    onChange={(e) => setCookingMethod(e.target.value)}
                  >
                    {METHOD_OPTIONS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="hs-field">
                <span className="hs-label">
                  Selling price ₦ (optional — context only; the maths runs on
                  protein cost)
                </span>
                <input
                  type="number"
                  min={1}
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(Number(e.target.value))}
                />
              </label>
              <button type="submit" className="hs-button" disabled={loading}>
                {loading ? "Screening swaps…" : "Transform this dish"}
              </button>
            </form>
          )}

          <fieldset className="hs-fieldset" style={{ marginTop: 18 }}>
            <legend className="hs-label">Constraints for the swap</legend>
            <label className="hs-field">
              <span className="hs-label">
                Protein floor — keep at least{" "}
                <span className="num">{floorPct}%</span> of the original protein
              </span>
              <span className="hs-dual">
                <input
                  type="number"
                  min={10}
                  max={200}
                  value={floorPct}
                  onChange={(e) => setFloorPct(Number(e.target.value))}
                />
                <input
                  type="range"
                  min={50}
                  max={100}
                  step={5}
                  value={Math.min(100, Math.max(50, floorPct))}
                  onChange={(e) => setFloorPct(Number(e.target.value))}
                />
              </span>
            </label>
            <label className="hs-field">
              <span className="hs-label">
                Budget cap ₦ per serving (optional — default: the cost of the
                protein being replaced)
              </span>
              <input
                type="number"
                min={1}
                placeholder="No cap beyond the default"
                value={budgetCap}
                onChange={(e) => setBudgetCap(e.target.value)}
              />
            </label>
            <div className="hs-checkrow">
              {ALLERGEN_OPTIONS.map((a) => (
                <label key={a.id} className="hs-check">
                  <input
                    type="checkbox"
                    checked={avoidAllergens.includes(a.id)}
                    onChange={() => toggleAllergen(a.id)}
                  />
                  {a.label}
                </label>
              ))}
            </div>
            <p className="hs-note">
              Allergen exclusions fail closed and are checked against the swap
              protein <em>and</em> the dish base — excluding peanut removes the
              kebab as composed, because its yaji is groundnut.
            </p>
          </fieldset>
        </div>

        <div className="hs-results" aria-live="polite">
          <p className="tv-explainer">
            <strong>How this works:</strong> every plant protein × 5 portions is
            screened by five hard gates — allergens, cooking-method survival
            (predicted from functional properties), protein floor, budget, time
            — then ranked. Nothing that fails a gate is shown as a
            recommendation.
          </p>

          {error && <p className="hs-alert--error">{error}</p>}
          {loading && !result && <p className="hs-note">Screening swaps…</p>}

          {result && original && (
            <>
              <p className="hs-note" style={{ margin: 0 }}>
                {result.dish.name} · {result.dish.cookingMethod} ·{" "}
                <span className="num">{result.inspected}</span> formulations
                screened · budget cap {fmtNgn(result.capNgn)} (
                {result.capSource === "caller"
                  ? "set by you"
                  : "the cost of the protein replaced"}
                ) · protein floor {fmtG(result.proteinFloorG)} (
                {Math.round(result.minProteinRatio * 100)}% of original). Costs
                below are <strong>protein-slot costs</strong> — the protein
                component only, not the full dish cost.
              </p>
              {result.dish.note && <p className="hs-warning">{result.dish.note}</p>}

              <div className="tv-versus">
                <article className="tv-card tv-card--original">
                  <p className="hs-card-kicker">Original</p>
                  <h4 className="hs-card-name">
                    {original.proteinName} · <span className="num">{original.portionG} g</span>
                  </h4>
                  <p className="hs-card-metric num">{fmtNgn(original.costNgn)}</p>
                  <p className="hs-card-metric-label">
                    protein-slot cost · <span className="num">{fmtG(original.proteinG)}</span>{" "}
                    protein
                  </p>
                  {original.priceDerived && (
                    <p className="hs-chiprow">
                      <span className="hs-chip hs-chip--warn">
                        Derived price — verify at market
                      </span>
                    </p>
                  )}
                  <p className="hs-note">Price basis: {original.priceBasis}</p>
                  <p className="hs-note">Protein data: {original.source}</p>
                </article>

                <div className="tv-versus-arrow" aria-hidden="true">
                  →
                </div>

                {best ? (
                  <article className="tv-card tv-card--best">
                    <p className="hs-card-kicker">
                      Best transformation · score{" "}
                      <span className="num">{best.score.toFixed(2)}</span>
                    </p>
                    <h4 className="hs-card-name">
                      {best.proteinName} · <span className="num">{best.portionG} g</span>
                    </h4>
                    <p className="hs-card-metric num">{fmtNgn(best.costNgn)}</p>
                    <p className="hs-card-metric-label">
                      protein-slot cost · <span className="num">{fmtG(best.proteinG)}</span>{" "}
                      protein · <span className="num">{best.prepMinutes} min</span>{" "}
                      modelled prep
                    </p>
                    <p className="tv-deltas">
                      <span
                        className={`tv-delta ${
                          costDelta < 0
                            ? "tv-delta--good"
                            : costDelta > 0
                              ? "tv-delta--bad"
                              : "tv-delta--flat"
                        }`}
                      >
                        Cost {signedNgn(costDelta)} ({signedPct(costDeltaPct)})
                      </span>
                      <span
                        className={`tv-delta ${
                          proteinDelta > 0
                            ? "tv-delta--good"
                            : proteinDelta < 0
                              ? "tv-delta--bad"
                              : "tv-delta--flat"
                        }`}
                      >
                        Protein {signedG(proteinDelta)} ({signedPct(proteinDeltaPct)})
                      </span>
                    </p>
                    <p className="hs-chiprow">
                      {(
                        [
                          ["solubility", "Solubility", best.functional.solubility],
                          ["waterHolding", "Water-holding", best.functional.waterHolding],
                          ["emulsification", "Emulsification", best.functional.emulsification],
                          ["gelation", "Gelation", best.functional.gelation],
                        ] as [keyof FunctionalProfile, string, FunctionalLevel][]
                      ).map(([key, label, level]) => {
                        const tested = best.functionalFocus.some(
                          (f) => f.property === key,
                        );
                        return (
                          <span
                            key={key}
                            className={`hs-chip${tested ? " tv-chip--focus" : ""}`}
                            title={
                              tested
                                ? `Tested by the ${result.dish.cookingMethod} survival screen`
                                : undefined
                            }
                          >
                            {label} {level}
                            {tested ? " •" : ""}
                          </span>
                        );
                      })}
                      {best.allergens.map((a) => (
                        <span key={a} className="hs-chip hs-chip--warn">
                          Contains {a}
                        </span>
                      ))}
                      {best.priceDerived && (
                        <span className="hs-chip hs-chip--warn">
                          Derived price — verify at market
                        </span>
                      )}
                    </p>
                    <p className="hs-note" style={{ margin: 0 }}>
                      Chips marked • are the properties the{" "}
                      {result.dish.cookingMethod} survival screen actually tests.
                    </p>
                    <p className="hs-card-facts">{best.whyItWorks}</p>
                    <details className="hs-advanced">
                      <summary>
                        Why it survives {result.dish.cookingMethod} — and the score
                      </summary>
                      {best.survivalReasons.map((r) => (
                        <p key={r.slice(0, 48)} className="hs-note">
                          {r}
                        </p>
                      ))}
                      <p className="hs-note">
                        Familiarity: {best.familiarityNote}. Score parts (weighted
                        cost 0.35 / protein 0.25 / functional fit 0.25 /
                        familiarity 0.15): cost {best.scoreParts.cost.toFixed(3)} ·
                        protein {best.scoreParts.protein.toFixed(3)} · functional
                        fit {best.scoreParts.functionalFit.toFixed(3)} ·
                        familiarity {best.scoreParts.familiarity.toFixed(3)}.
                      </p>
                      <p className="hs-note">Price basis: {best.priceBasis}</p>
                      <p className="hs-note">Protein data: {best.source}</p>
                    </details>
                  </article>
                ) : (
                  <article className="tv-card tv-card--none">
                    <p className="hs-card-kicker">Best transformation</p>
                    <h4 className="hs-card-name">No survivor</h4>
                    <p>
                      No plant protein passed all five gates for this dish under
                      these constraints. The gates were <strong>not</strong>{" "}
                      relaxed — the reasoning trace below shows exactly what
                      blocked every formulation.
                    </p>
                    {result.nearMiss && (
                      <p className="tv-nearmiss">
                        Closest near-miss: <strong>{result.nearMiss.id}</strong>{" "}
                        at {fmtNgn(result.nearMiss.costNgn)} — only{" "}
                        {fmtNgn(result.nearMiss.overByNgn)} over the cap, with{" "}
                        {fmtG(result.nearMiss.proteinG)} protein. Raising the cap
                        to {fmtNgn(result.nearMiss.costNgn)} would admit it.
                      </p>
                    )}
                  </article>
                )}
              </div>

              {result.alternatives.length > 0 && (
                <>
                  <h3 className="hs-panel-title" style={{ margin: 0 }}>
                    Also eligible
                  </h3>
                  <div className="tv-alts">
                    {result.alternatives.map((alt) => {
                      const dNgn = alt.costNgn - original.costNgn;
                      const dPct =
                        original.costNgn > 0 ? (dNgn / original.costNgn) * 100 : 0;
                      return (
                        <article key={alt.id} className="tv-alt">
                          <p className="hs-card-kicker">
                            Score <span className="num">{alt.score.toFixed(2)}</span>
                          </p>
                          <h4 className="hs-card-name" style={{ fontSize: "1.02rem" }}>
                            {alt.proteinName} ·{" "}
                            <span className="num">{alt.portionG} g</span>
                          </h4>
                          <p className="hs-note" style={{ margin: 0 }}>
                            <span className="num">{fmtNgn(alt.costNgn)}</span> ·{" "}
                            <span className="num">{fmtG(alt.proteinG)}</span> protein
                            ·{" "}
                            <span
                              className={
                                dNgn < 0 ? "tv-good" : dNgn > 0 ? "tv-bad" : ""
                              }
                            >
                              {signedNgn(dNgn)} ({signedPct(dPct)})
                            </span>
                          </p>
                          {alt.priceDerived && (
                            <p className="hs-chiprow">
                              <span className="hs-chip hs-chip--warn">
                                Derived price
                              </span>
                            </p>
                          )}
                          <p className="hs-note">{alt.kitchenMeaning}</p>
                        </article>
                      );
                    })}
                  </div>
                </>
              )}

              <div>
                <h3 className="hs-panel-title" style={{ marginBottom: 8 }}>
                  Rejected — by first failing gate
                </h3>
                <p className="hs-chiprow" style={{ margin: 0 }}>
                  {(Object.keys(REJECT_LABELS) as RejectReason[]).map((reason) => (
                    <span key={reason} className="hs-chip">
                      {REJECT_LABELS[reason]}:{" "}
                      <span className="num">{result.rejectedCounts[reason]}</span>
                    </span>
                  ))}
                  <span className="hs-chip">
                    Survived:{" "}
                    <span className="num">
                      {result.inspected -
                        Object.values(result.rejectedCounts).reduce(
                          (sum, n) => sum + n,
                          0,
                        )}
                    </span>
                  </span>
                </p>
                {result.rejected.length > 0 && (
                  <details className="hs-advanced">
                    <summary>Example rejections, with reasons</summary>
                    {result.rejected.map((r) => (
                      <p key={`${r.reason}-${r.id}`} className="hs-note">
                        <strong>{r.id}</strong> ({REJECT_LABELS[r.reason]}):{" "}
                        {r.detail}
                      </p>
                    ))}
                  </details>
                )}
              </div>

              <div className="tv-trace">
                <h3>Reasoning trace</h3>
                <ol className="tv-trace-list">
                  {result.trace.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ol>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
