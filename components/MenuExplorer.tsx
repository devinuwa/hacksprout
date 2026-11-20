"use client";

import { useEffect, useState } from "react";
import type { FunctionalProfile } from "@/lib/proteins";

interface MenuDishView {
  name: string;
  priceNgn: number;
  priceNote?: string;
  proteinSource: string;
  allergens: string[];
  renamedFrom?: string;
  priceAligned?: boolean;
  note?: string;
  functional: FunctionalProfile | null;
  kitchenMeaning: string | null;
  proteinSourceDetail: string | null;
}

interface MenuPayload {
  sourceNote: string;
  lapsesFixed: string[];
  categoryCount: number;
  dishCount: number;
  categories: { name: string; dishes: MenuDishView[] }[];
}

const fmt = (n: number) => `₦${n.toLocaleString("en-NG")}`;

function FunctionalLine({ f }: { f: FunctionalProfile }) {
  return (
    <p className="hs-func-line">
      <span className="hs-func-label">In the kitchen:</span> solubility {f.solubility} ·
      water-holding {f.waterHolding} · emulsification {f.emulsification} · gelation{" "}
      {f.gelation}
    </p>
  );
}

export default function MenuExplorer() {
  const [menu, setMenu] = useState<MenuPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    fetch("/api/menu")
      .then((r) => {
        if (!r.ok) throw new Error(`Menu request failed (${r.status})`);
        return r.json();
      })
      .then((data: MenuPayload) => {
        if (live) setMenu(data);
      })
      .catch((err: unknown) => {
        if (live) setError(err instanceof Error ? err.message : "Could not load the menu");
      });
    return () => {
      live = false;
    };
  }, []);

  return (
    <section id="menu" className="hs-section">
      <h2 className="hs-section-title">The menu, fixed</h2>
      <p className="hs-section-lede">
        A real Lagos plant-based menu — Veggie Victory, Nigeria&apos;s first vegan
        restaurant — audited and repaired. the grilled skewers go by kebab, every dish names
        its protein, allergens are labelled, and the sections the original menu
        lost (Drinks, Big Bowls) are back.
      </p>

      {error && <p className="hs-alert--error">{error}</p>}
      {!menu && !error && <p className="hs-note">Loading the menu…</p>}

      {menu && (
        <>
          <p className="hs-note hs-explorer-note">
            {menu.dishCount} dishes · {menu.categoryCount} categories · {menu.sourceNote}
          </p>
          {menu.categories.map((cat) => (
            <div key={cat.name} className="hs-menu-category">
              <h3 className="hs-menu-category-title">{cat.name}</h3>
              <div className="hs-menu-grid">
                {cat.dishes.map((dish) => (
                  <article key={dish.name} className="hs-menu-card">
                    <div className="hs-menu-card-head">
                      <h4 className="hs-menu-name">{dish.name}</h4>
                      <span className="hs-menu-price num">
                        {fmt(dish.priceNgn)}
                        {dish.priceAligned ? " †" : ""}
                      </span>
                    </div>
                    {dish.priceNote && <p className="hs-note">{dish.priceNote}</p>}
                    {dish.renamedFrom && (
                      <p className="hs-note">Renamed from “{dish.renamedFrom}”.</p>
                    )}
                    <p className="hs-menu-protein">
                      <strong>Protein:</strong> {dish.proteinSource}
                    </p>
                    {dish.allergens.length > 0 && (
                      <p className="hs-chiprow">
                        {dish.allergens.map((a) => (
                          <span key={a} className="hs-chip hs-chip--warn">
                            Allergen: {a}
                          </span>
                        ))}
                      </p>
                    )}
                    {dish.functional && <FunctionalLine f={dish.functional} />}
                    {dish.kitchenMeaning && (
                      <p className="hs-note">{dish.kitchenMeaning}</p>
                    )}
                    {dish.note && <p className="hs-note">{dish.note}</p>}
                  </article>
                ))}
              </div>
            </div>
          ))}
          <p className="hs-note">
            † Price aligned with the other swallows — the original menu published no
            price for these three swallows.
          </p>

          <div className="hs-fixed">
            <h3 className="hs-panel-title">What we fixed from the real menu</h3>
            <ol className="hs-fixed-list">
              {menu.lapsesFixed.map((lapse) => (
                <li key={lapse.slice(0, 32)}>{lapse}</li>
              ))}
            </ol>
          </div>
        </>
      )}
    </section>
  );
}
