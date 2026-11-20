"use client";

import { useState } from "react";

/**
 * Whole-Menu Dashboard — engine v2, commercialisation view.
 *
 * One call to POST /api/transform-menu transforms every catalogue dish
 * under the default constraints (protein floor 90%, budget cap = the cost
 * of the protein being replaced) and renders the aggregates the API
 * computed. Nothing is re-derived in the browser except per-row deltas,
 * which are plain arithmetic on the returned costs/proteins.
 */

type RejectReason =
  | "allergen"
  | "method-survival"
  | "protein-floor"
  | "budget"
  | "prep-time";

interface MenuResultRow {
  dish: { dishId: string; name: string; cookingMethod: string };
  original: {
    proteinName: string;
    portionG: number;
    costNgn: number;
    proteinG: number;
  };
  best: {
    proteinName: string;
    portionG: number;
    costNgn: number;
    proteinG: number;
    priceDerived: boolean;
  } | null;
  nearMiss: { id: string; costNgn: number; overByNgn: number } | null;
  minProteinRatio: number;
}

interface MenuTransformResponse {
  results: MenuResultRow[];
  aggregates: {
    dishesTransformed: number;
    dishesWithSurvivor: number;
    medianCostDeltaPct: number | null;
    medianProteinDeltaPct: number | null;
    rejectedByReason: Record<RejectReason, number>;
  };
}

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
const signedPct = (p: number) =>
  `${p > 0 ? "+" : p < 0 ? "−" : ""}${Math.abs(p).toFixed(1)}%`;

const COST_LABEL =
  "protein-slot cost (the protein component only, not the full dish cost)";

export default function MenuDashboard() {
  const [data, setData] = useState<MenuTransformResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/transform-menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const body: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const msg =
          body && typeof body === "object" && "error" in body
            ? String((body as { error: unknown }).error)
            : `Request failed (${res.status})`;
        throw new Error(msg);
      }
      setData(body as MenuTransformResponse);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : "Menu transform failed");
    } finally {
      setLoading(false);
    }
  };

  const agg = data?.aggregates ?? null;
  const floorPct = data?.results[0]
    ? Math.round(data.results[0].minProteinRatio * 100)
    : 90;
  const rejectEntries = agg
    ? (Object.entries(agg.rejectedByReason) as [RejectReason, number][]).sort(
        (a, b) => b[1] - a[1],
      )
    : [];
  const rejectMax = rejectEntries.length > 0 ? rejectEntries[0][1] : 0;

  return (
    <section id="dashboard" className="hs-section">
      <h2 className="hs-section-title">Whole-Menu Dashboard</h2>
      <p className="hs-section-lede">
        The commercialisation view: run the transformation engine over the{" "}
        <strong>entire menu at once</strong> — every dish, same gates, same
        default constraints (protein floor {floorPct}%, and a swap may not cost
        more than the protein it replaces). This is the number a restaurant
        group or investor asks for: what happens to the whole menu, not one
        dish.
      </p>

      <div className="db-actions">
        <button
          type="button"
          className="hs-button"
          onClick={() => void run()}
          disabled={loading}
        >
          {loading
            ? "Transforming the full menu…"
            : data
              ? "Re-run the full-menu transform"
              : "Transform the full menu"}
        </button>
      </div>

      {error && <p className="hs-alert--error">{error}</p>}

      {data && agg && (
        <div aria-live="polite">
          <div className="db-stats">
            <div className="db-stat">
              <span className="db-stat-num num">{agg.dishesTransformed}</span>
              <span className="db-stat-label">dishes transformed</span>
            </div>
            <div className="db-stat">
              <span className="db-stat-num num">
                {agg.dishesWithSurvivor} / {agg.dishesTransformed}
              </span>
              <span className="db-stat-label">
                dishes with a passing swap (all five gates)
              </span>
            </div>
            <div className="db-stat">
              <span className="db-stat-num num">
                {agg.medianCostDeltaPct === null
                  ? "—"
                  : signedPct(agg.medianCostDeltaPct)}
              </span>
              <span className="db-stat-label">
                median {COST_LABEL} change
              </span>
            </div>
            <div className="db-stat">
              <span className="db-stat-num num">
                {agg.medianProteinDeltaPct === null
                  ? "—"
                  : signedPct(agg.medianProteinDeltaPct)}
              </span>
              <span className="db-stat-label">
                median protein change per serving
              </span>
            </div>
          </div>

          {agg.dishesTransformed > 0 &&
          agg.dishesWithSurvivor === agg.dishesTransformed ? (
            <p className="db-pitch">
              Every dish on this menu has at least one plant-based
              transformation that survives its own cooking method, holds ≥
              {floorPct}% of the protein, and costs no more than the protein it
              replaces.
            </p>
          ) : agg.dishesWithSurvivor > 0 ? (
            <p className="db-pitch">
              {agg.dishesWithSurvivor} of {agg.dishesTransformed} dishes have at
              least one plant-based transformation that survives its own cooking
              method, holds ≥{floorPct}% of the protein, and costs no more than
              the protein it replaces. The rest are reported honestly in the
              table — with the near-miss named, never a quietly relaxed
              constraint.
            </p>
          ) : (
            <p className="db-pitch">
              No dish produced a surviving transformation under the default
              constraints. That outcome is reported, not hidden — the table
              shows the near-miss for each dish.
            </p>
          )}

          <div className="hs-tablewrap">
            <table className="hs-table">
              <thead>
                <tr>
                  <th scope="col">Dish</th>
                  <th scope="col">Original protein ({COST_LABEL} / protein)</th>
                  <th scope="col">Best swap ({COST_LABEL} / protein)</th>
                  <th scope="col">Cost Δ%</th>
                  <th scope="col">Protein Δ%</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.results.map((r) => {
                  const costPct =
                    r.best && r.original.costNgn > 0
                      ? ((r.best.costNgn - r.original.costNgn) /
                          r.original.costNgn) *
                        100
                      : null;
                  const proteinPct =
                    r.best && r.original.proteinG > 0
                      ? ((r.best.proteinG - r.original.proteinG) /
                          r.original.proteinG) *
                        100
                      : null;
                  return (
                    <tr key={r.dish.dishId}>
                      <td>
                        <strong>{r.dish.name}</strong>
                        <br />
                        <span className="hs-note">{r.dish.cookingMethod}</span>
                      </td>
                      <td className="num">
                        {r.original.proteinName} · {r.original.portionG} g
                        <br />
                        {fmtNgn(r.original.costNgn)} / {fmtG(r.original.proteinG)}
                      </td>
                      <td className="num">
                        {r.best ? (
                          <>
                            {r.best.proteinName} · {r.best.portionG} g
                            {r.best.priceDerived && (
                              <span className="db-tag">derived price</span>
                            )}
                            <br />
                            {fmtNgn(r.best.costNgn)} / {fmtG(r.best.proteinG)}
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td
                        className={`num ${
                          costPct === null
                            ? ""
                            : costPct < 0
                              ? "db-good"
                              : costPct > 0
                                ? "db-bad"
                                : ""
                        }`}
                      >
                        {costPct === null ? "—" : signedPct(costPct)}
                      </td>
                      <td
                        className={`num ${
                          proteinPct === null
                            ? ""
                            : proteinPct > 0
                              ? "db-good"
                              : proteinPct < 0
                                ? "db-bad"
                                : ""
                        }`}
                      >
                        {proteinPct === null ? "—" : signedPct(proteinPct)}
                      </td>
                      <td>
                        {r.best ? (
                          <span className="db-status--ok">Transformed</span>
                        ) : (
                          <>
                            <span className="db-status--none">No survivor</span>
                            {r.nearMiss && (
                              <>
                                <br />
                                <span className="hs-note">
                                  near-miss {r.nearMiss.id},{" "}
                                  {fmtNgn(r.nearMiss.overByNgn)} over the cap
                                </span>
                              </>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="hs-note">
            All costs in this table are {COST_LABEL}s. Dish bases are
            allergen-checked but not priced, because the verified dataset
            carries no prices for them. A “derived price” tag means that
            protein&apos;s price was modelled from a related market series (no
            direct series exists) and is labelled as such in the catalogue.
          </p>

          <h3 className="hs-panel-title" style={{ marginTop: 22 }}>
            Where formulations were rejected — whole menu
          </h3>
          <p className="hs-note" style={{ marginTop: 0 }}>
            Each formulation is counted once, at the first gate that stopped it
            (gates run in order: allergen → method survival → protein floor →
            budget → prep time).
          </p>
          <div className="db-bars">
            {rejectEntries.map(([reason, count]) => (
              <div key={reason} className="db-bar-row">
                <span className="db-bar-label">{REJECT_LABELS[reason]}</span>
                <span className="db-bar-track">
                  <span
                    className="db-bar-fill"
                    style={{
                      width:
                        rejectMax > 0
                          ? `${Math.max(2, (count / rejectMax) * 100)}%`
                          : "0%",
                    }}
                  />
                </span>
                <span className="db-bar-count num">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
