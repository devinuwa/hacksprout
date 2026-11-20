import { PROTEINS } from "@/lib/proteins";

/**
 * Functional-properties spotlight: the four cooking-behaviour properties for
 * every protein in the catalogue, rendered straight from lib/proteins.ts.
 * Server component — no client JS needed.
 */
export default function FunctionalSpotlight() {
  return (
    <section id="functional" className="hs-section">
      <h2 className="hs-section-title">Why a swap survives the kitchen</h2>
      <p className="hs-section-lede">
        Protein grams are only half the decision. Whether a swap holds on the
        grill, drinks up a marinade, thickens a soup or sets into shape is
        decided by four functional properties — and the Studio scores every
        candidate on the two that matter for the dish you picked.
      </p>
      <div className="hs-tablewrap">
        <table className="hs-table">
          <thead>
            <tr>
              <th>Protein</th>
              <th>Solubility</th>
              <th>Water-holding</th>
              <th>Emulsification</th>
              <th>Gelation</th>
              <th>What it means in the kitchen</th>
            </tr>
          </thead>
          <tbody>
            {PROTEINS.map((p) => (
              <tr key={p.id}>
                <td>
                  <strong>{p.name}</strong>
                  {(p.id === "chicken" || p.id === "beef") && (
                    <span className="hs-note"> — reference only</span>
                  )}
                </td>
                <td>{p.functional.solubility}</td>
                <td>{p.functional.waterHolding}</td>
                <td>{p.functional.emulsification}</td>
                <td>{p.functional.gelation}</td>
                <td>{p.kitchenMeaning}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="hs-note">
        Functional properties are qualitative, literature-based descriptors of
        cooking behaviour — not lab measurements, and never presented as such.
      </p>
    </section>
  );
}
