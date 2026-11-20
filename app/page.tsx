import MenuExplorer from "@/components/MenuExplorer";
import Studio from "@/components/Studio";
import FunctionalSpotlight from "@/components/FunctionalSpotlight";
import JoinForm from "@/components/JoinForm";

const CONSTRAINTS: { title: string; line: string }[] = [
  {
    title: "Data accuracy",
    line: "Labelled estimates, editable prices, sources shown next to every number.",
  },
  {
    title: "Cost",
    line: "Local ingredients first; cost per serving optimised, never just cost per kilo.",
  },
  {
    title: "Nutrition",
    line: "Targets are set before anything is generated; gaps are flagged, never hidden.",
  },
  {
    title: "Taste & texture",
    line: "Functional properties checked for every swap, with a chef validation path.",
  },
  {
    title: "AI reliability",
    line: "AI proposes; structured data and hard rules decide. The model never invents a number.",
  },
  {
    title: "Kitchen reality",
    line: "Equipment, time, stock and workflow filter everything before it reaches you.",
  },
];

export default function HomePage() {
  return (
    <div className="hs-shell">
      <header className="hs-header">
        <p className="hs-wordmark">HackSprout</p>
        <nav className="hs-nav" aria-label="Sections">
          <a href="#menu">Menu</a>
          <a href="#studio">Studio</a>
          <a href="#why">Why it works</a>
          <a href="#join">Join</a>
        </nav>
      </header>

      <section className="hs-hero">
        <h1>Diversify the protein. Revolutionise the plate.</h1>
        <p className="hs-hero-purpose">
          Most Nigerian meals are carbohydrate-first — rice, garri, yam, amala —
          with protein as the expensive afterthought that shrinks first when
          prices rise. HackSprout redesigns the protein in the dishes
          restaurants already sell: cheaper per serving, the protein target
          protected, and every swap checked against the real constraints of a
          Nigerian kitchen before it is recommended.
        </p>
        <a className="hs-hero-cta" href="#studio">
          Try the Kitchen Studio
        </a>
      </section>

      <section id="why" className="hs-section">
        <h2 className="hs-section-title">Why it works: six constraints, no shortcuts</h2>
        <p className="hs-section-lede">
          A substitution that fails on cost, nutrition, taste or equipment is
          worse than no substitution. Every HackSprout recommendation is tested
          against all six constraints first.
        </p>
        <div className="hs-constraints">
          {CONSTRAINTS.map((c, i) => (
            <article key={c.title} className="hs-constraint">
              <p className="hs-constraint-num">{i + 1}</p>
              <h3>{c.title}</h3>
              <p>{c.line}</p>
            </article>
          ))}
        </div>
      </section>

      <MenuExplorer />

      <Studio />

      <FunctionalSpotlight />

      <section id="evidence" className="hs-section">
        <h2 className="hs-section-title">Evidence, not vibes</h2>
        <p className="hs-section-lede">
          Built on <strong>FAO WAFCT 2019</strong> · <strong>USDA FoodData
          Central</strong> · <strong>WFP Nigeria food prices</strong> ·{" "}
          <strong>NBS Selected Food Price Watch</strong>. Every number in this
          app carries its source, and prices that had to be derived are
          labelled derived — never dressed up as market quotes.
        </p>
        <details className="hs-evidence">
          <summary>Data sources &amp; verification summary</summary>
          <div className="hs-evidence-body">
            <p>
              <strong>Nutrition.</strong> Protein values were read directly from
              the named dataset rows: soy chunks 41.71 g/100 g (USDA “Meat
              extender”, FDC 174268); awara 17.27 g/100 g (USDA firm tofu, FDC
              172475); egusi 19.5 g/100 g (WAFCT 06_035); bambara 19.5 g/100 g
              (WAFCT 03_001); dawadawa 33.1 g/100 g (WAFCT 03_042); mushrooms
              3.09 g/100 g (USDA, FDC 169376 — a white-mushroom proxy for Abuja
              oyster mushrooms, flagged as such); chicken 23.0 g/100 g (WAFCT
              07_033); beef 20.3 g/100 g (WAFCT 07_023). Dish ingredients are
              all WAFCT 2019 rows. The single derived nutrition value is soy
              milk (2.7 g/100 g), modelled from WAFCT soybean 03_008 with the
              arithmetic documented in the dataset.
            </p>
            <p>
              <strong>Prices.</strong> Beef ₦6,375/kg is the WFP Nigeria 2026
              retail median (228 observations, computed from the data file);
              chicken ₦7,059/kg is Numbeo Abuja via the team&apos;s price
              records; soy chunks ₦8,850/kg is packaged retail (Supermart.ng,
              Nutrela). Four prices are honestly labelled{" "}
              <em>derived/modelled</em> because no market series exists: awara
              ₦450/kg (from the ₦650/kg soybean price and a ~2 kg yield),
              bambara ₦960/kg (WFP cowpea band), egusi ₦1,591/kg (WFP
              groundnut proxy — a floor value), dawadawa ₦5,000/kg (modelled
              placeholder, used at 5–10 g per serving), and soy milk ₦900/L
              (the weakest price in the set). WFP prices are survey medians,
              not a live feed — no live price feed exists for Nigerian
              informal markets.
            </p>
            <p>
              <strong>Deliberately not used:</strong> HESTIA footprint data
              (its table covers 48 countries; Nigeria is not one of them) and
              Open Food Facts (crowdsourced; only 35 of 200 Nigeria-tagged
              products carry protein values). Functional properties are
              qualitative, literature-based descriptors — not measurements.
            </p>
            <p>
              <strong>Legume caution:</strong> bambara groundnut and dawadawa
              are legumes but are not peanut, so they are not labelled peanut.
              The fail-closed peanut rule applies to actual groundnut/peanut
              (WAFCT 06_010) — including the yaji in kebab.
            </p>
          </div>
        </details>
      </section>

      <JoinForm />

      <footer className="hs-footer">
        <p>
          <strong>HackSprout</strong> — built for Hack the Fork Nigeria 2026,
          Challenge 2: AI for Plant-Based Menu Innovation. Menu: Veggie Victory
          (Lagos), lapses fixed. Data: FAO WAFCT 2019 · USDA FoodData Central ·
          WFP Nigeria · NBS. A constraint-aware decision-support tool — not a
          guarantee of a perfect recipe; kitchen validation still matters.
        </p>
      </footer>
    </div>
  );
}
