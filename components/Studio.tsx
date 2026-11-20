"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ALL_EQUIPMENT,
  DEFAULT_REQUEST,
  DISH_CONTEXTS,
  EQUIPMENT_LABELS,
  SUPPORTED_ALLERGENS,
  explore,
  type DishContextId,
  type ExploreRequest,
  type ExploreResponse,
} from "@/lib/engine";
import { PLANT_PROTEINS } from "@/lib/engine";
import { INGREDIENTS } from "@/lib/ingredients";

const fmt = (n: number) => `₦${n.toLocaleString("en-NG")}`;

const ALL_STOCK_IDS = [
  ...PLANT_PROTEINS.map((p) => p.id),
  ...INGREDIENTS.map((i) => i.id),
];

export default function Studio() {
  const [dishContext, setDishContext] = useState<DishContextId>(DEFAULT_REQUEST.dishContext);
  const [budgetNgn, setBudgetNgn] = useState(DEFAULT_REQUEST.budgetNgn);
  const [proteinTargetG, setProteinTargetG] = useState(DEFAULT_REQUEST.proteinTargetG);
  const [maxPrepMinutes, setMaxPrepMinutes] = useState(DEFAULT_REQUEST.maxPrepMinutes);
  const [equipment, setEquipment] = useState<string[]>([...DEFAULT_REQUEST.equipment]);
  const [avoidAllergens, setAvoidAllergens] = useState<string[]>([]);
  const [stock, setStock] = useState<string[]>([...ALL_STOCK_IDS]);
  const [restrictStock, setRestrictStock] = useState(false);

  const [result, setResult] = useState<ExploreResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const run = useCallback(async () => {
    const req: ExploreRequest = {
      dishContext,
      budgetNgn,
      proteinTargetG,
      maxPrepMinutes,
      equipment,
      availableIngredients: restrictStock ? stock : null,
      avoidAllergens,
    };
    setLoading(true);
    setError(null);
    try {
      setResult(await explore(req));
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Engine request failed");
    } finally {
      setLoading(false);
    }
  }, [
    dishContext,
    budgetNgn,
    proteinTargetG,
    maxPrepMinutes,
    equipment,
    restrictStock,
    stock,
    avoidAllergens,
  ]);

  useEffect(() => {
    void run();
  }, [run]);

  const toggle = (list: string[], setList: (v: string[]) => void, value: string) =>
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const contextDef = DISH_CONTEXTS.find((c) => c.id === dishContext);

  return (
    <section id="studio" className="hs-section">
      <h2 className="hs-section-title">Kitchen Studio</h2>
      <p className="hs-section-lede">
        Pick a dish, set your kitchen&apos;s real limits, and the engine composes
        protein swaps from verified data. Hard constraints — budget, protein,
        time, equipment, stock, allergens — are pass/fail. The score only ranks
        what survives. Costs are the protein swap itself (dish bases are checked
        for allergens and stock, not costed).
      </p>

      <div className="hs-layout">
        <form
          className="hs-panel"
          onSubmit={(e) => {
            e.preventDefault();
            void run();
          }}
        >
          <h3 className="hs-panel-title">Your dish &amp; limits</h3>

          <label className="hs-field">
            <span className="hs-label">Dish to redesign</span>
            <select
              value={dishContext}
              onChange={(e) => setDishContext(e.target.value as DishContextId)}
            >
              {DISH_CONTEXTS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          {contextDef && <p className="hs-note">{contextDef.description}</p>}

          <label className="hs-field">
            <span className="hs-label">Budget per serving — {fmt(budgetNgn)}</span>
            <span className="hs-dual">
              <input
                type="number"
                min={1}
                value={budgetNgn}
                onChange={(e) => setBudgetNgn(Number(e.target.value))}
              />
              <input
                type="range"
                min={200}
                max={3000}
                step={50}
                value={budgetNgn}
                onChange={(e) => setBudgetNgn(Number(e.target.value))}
              />
            </span>
          </label>

          <label className="hs-field">
            <span className="hs-label">
              Protein target — <span className="num">{proteinTargetG} g</span>
            </span>
            <span className="hs-dual">
              <input
                type="number"
                min={0}
                value={proteinTargetG}
                onChange={(e) => setProteinTargetG(Number(e.target.value))}
              />
              <input
                type="range"
                min={0}
                max={40}
                step={1}
                value={proteinTargetG}
                onChange={(e) => setProteinTargetG(Number(e.target.value))}
              />
            </span>
          </label>

          <label className="hs-field">
            <span className="hs-label">
              Max preparation time — <span className="num">{maxPrepMinutes} min</span>
            </span>
            <span className="hs-dual">
              <input
                type="number"
                min={1}
                value={maxPrepMinutes}
                onChange={(e) => setMaxPrepMinutes(Number(e.target.value))}
              />
              <input
                type="range"
                min={10}
                max={120}
                step={5}
                value={maxPrepMinutes}
                onChange={(e) => setMaxPrepMinutes(Number(e.target.value))}
              />
            </span>
          </label>

          <fieldset className="hs-fieldset">
            <legend className="hs-label">Equipment in your kitchen</legend>
            <div className="hs-checkrow">
              {ALL_EQUIPMENT.map((e) => (
                <label key={e} className="hs-check">
                  <input
                    type="checkbox"
                    checked={equipment.includes(e)}
                    onChange={() => toggle(equipment, setEquipment, e)}
                  />
                  {EQUIPMENT_LABELS[e]}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="hs-fieldset">
            <legend className="hs-label">Allergen exclusions (fail closed)</legend>
            <div className="hs-checkrow">
              {SUPPORTED_ALLERGENS.map((a) => (
                <label key={a} className="hs-check">
                  <input
                    type="checkbox"
                    checked={avoidAllergens.includes(a)}
                    onChange={() => toggle(avoidAllergens, setAvoidAllergens, a)}
                  />
                  No {a}
                  {a === "peanut" ? " (incl. groundnut)" : a === "soy" ? " (soya)" : " (wheat)"}
                </label>
              ))}
            </div>
            <p className="hs-note">
              Exclusions are absolute: a candidate whose protein or dish base
              carries the allergen — or whose allergen status cannot be verified —
              is removed, never scored back in.
            </p>
          </fieldset>

          <details className="hs-advanced">
            <summary>Stock: what you have on hand</summary>
            <label className="hs-check">
              <input
                type="checkbox"
                checked={restrictStock}
                onChange={(e) => setRestrictStock(e.target.checked)}
              />
              Only use what I stock
            </label>
            {restrictStock && (
              <>
                <p className="hs-label">Proteins in stock</p>
                <div className="hs-checkrow">
                  {PLANT_PROTEINS.map((p) => (
                    <label key={p.id} className="hs-check">
                      <input
                        type="checkbox"
                        checked={stock.includes(p.id)}
                        onChange={() => toggle(stock, setStock, p.id)}
                      />
                      {p.name}
                    </label>
                  ))}
                </div>
                <p className="hs-label">Dish ingredients in stock</p>
                <div className="hs-checkrow">
                  {INGREDIENTS.map((i) => (
                    <label key={i.id} className="hs-check">
                      <input
                        type="checkbox"
                        checked={stock.includes(i.id)}
                        onChange={() => toggle(stock, setStock, i.id)}
                      />
                      {i.name}
                    </label>
                  ))}
                </div>
              </>
            )}
          </details>

          <button type="submit" className="hs-button" disabled={loading}>
            {loading ? "Checking constraints…" : "Run the constraint check"}
          </button>
        </form>

        <div className="hs-results" aria-live="polite">
          {error && <p className="hs-alert--error">{error}</p>}

          {result && (
            <>
              <div className="hs-summary">
                <div className="hs-stat">
                  <span className="hs-stat-num num">{result.inspected}</span>
                  <span className="hs-stat-label">formulations composed</span>
                </div>
                <div className="hs-stat">
                  <span className="hs-stat-num num">{result.eligibleCount}</span>
                  <span className="hs-stat-label">pass every constraint</span>
                </div>
                <div className="hs-stat">
                  <span className="hs-stat-num num">
                    {fmt(result.reference.costNgn)} / {result.reference.proteinG} g
                  </span>
                  <span className="hs-stat-label">
                    chicken benchmark, 100 g (comparison only)
                  </span>
                </div>
              </div>

              <p className="hs-note">
                Rejected by constraint — budget {result.rejectedBy.budget} · protein{" "}
                {result.rejectedBy.protein} · time {result.rejectedBy.time} · equipment{" "}
                {result.rejectedBy.equipment} · stock {result.rejectedBy.ingredients} ·
                allergen {result.rejectedBy.allergen}. A formulation can fail several.
              </p>

              {result.candidates.length === 0 ? (
                <div className="hs-nofeasible">
                  <h3>No eligible formulation</h3>
                  <p>
                    Nothing in the verified catalogue satisfies all of your
                    constraints at once. We do not relax a constraint silently —
                    here is what blocked it:
                  </p>
                  {result.failureNotes.map((note) => (
                    <p key={note.slice(0, 40)}>{note}</p>
                  ))}
                </div>
              ) : (
                <div className="hs-cards">
                  {result.candidates.slice(0, 9).map((c, idx) => (
                    <article key={c.id} className="hs-card">
                      <p className="hs-card-kicker">
                        {idx === 0 ? "Top ranked" : `Rank ${idx + 1}`} · score{" "}
                        <span className="num">{c.score.toFixed(2)}</span>
                      </p>
                      <h4 className="hs-card-name">
                        {c.proteinName} · <span className="num">{c.portionG} g</span>
                      </h4>
                      <p className="hs-card-metric num">{fmt(c.costNgn)}</p>
                      <p className="hs-card-metric-label">
                        protein swap per serving ·{" "}
                        <span className="num">{c.proteinG} g</span> protein ·{" "}
                        <span className="num">{c.prepMinutes} min</span> prep
                      </p>
                      <p className="hs-chiprow">
                        <span className="hs-chip">
                          Solubility {c.functional.solubility}
                        </span>
                        <span className="hs-chip">
                          Water-holding {c.functional.waterHolding}
                        </span>
                        <span className="hs-chip">
                          Emulsification {c.functional.emulsification}
                        </span>
                        <span className="hs-chip">Gelation {c.functional.gelation}</span>
                        {c.allergens.map((a) => (
                          <span key={a} className="hs-chip hs-chip--warn">
                            Contains {a}
                          </span>
                        ))}
                        {c.priceDerived && (
                          <span className="hs-chip hs-chip--warn">
                            Derived price — verify at market
                          </span>
                        )}
                      </p>
                      <p className="hs-card-facts">{c.whyWorks}</p>
                      <p className="hs-note">
                        Score: cost {(c.scoreParts.cost / 0.45).toFixed(2)} · protein{" "}
                        {(c.scoreParts.protein / 0.25).toFixed(2)} · time{" "}
                        {(c.scoreParts.time / 0.15).toFixed(2)} · functional fit{" "}
                        {(c.scoreParts.functionalFit / 0.15).toFixed(2)} (weighted
                        45/25/15/15)
                      </p>
                      <p className="hs-note">Price basis: {c.priceBasis}</p>
                      <p className="hs-note">Protein data: {c.source}</p>
                    </article>
                  ))}
                </div>
              )}
              {result.candidates.length > 9 && (
                <p className="hs-note">
                  Showing the top 9 of {result.candidates.length} eligible
                  formulations.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
