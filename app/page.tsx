import { proteinImageSrc } from "@/lib/protein-images";
import WelcomeIntro from "@/components/WelcomeIntro";
import MenuExplorer from "@/components/MenuExplorer";
import Studio from "@/components/Studio";
import TransformStudio from "@/components/TransformStudio";
import MenuDashboard from "@/components/MenuDashboard";
import FunctionalSpotlight from "@/components/FunctionalSpotlight";
import JoinForm from "@/components/JoinForm";

const CONSTRAINTS: { title: string; line: string }[] = [
  {
    title: "Data accuracy",
    line: "Labelled estimates, editable prices, and the basis of every price shown next to the number.",
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
      <WelcomeIntro />
      <header className="hs-header">
        <p className="hs-wordmark">HackSprout</p>
        <nav className="hs-nav" aria-label="Sections">
          <a href="#menu">Menu</a>
          <a href="#studio">Studio</a>
          <a href="#transform">Transform</a>
          <a href="#dashboard">Dashboard</a>
          <a href="#why">Why it works</a>
          <a href="#join">Join</a>
        </nav>
      </header>

      <section className="hs-hero">
        <p className="hs-hero-kicker">
          For Nigerian kitchens — bukas, canteens, caterers &amp; restaurants
        </p>
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
        <div className="hs-hero-strip" aria-hidden="true">
          {["soy-chunks", "awara", "bambara", "egusi"].map((id) => {
            const src = proteinImageSrc(id);
            return src ? <img key={id} src={src} alt="" /> : null;
          })}
        </div>
      </section>

      <section id="why" className="hs-section">
        <p className="hs-kicker">Built for real kitchens</p>
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

      <TransformStudio />

      <MenuDashboard />

      <FunctionalSpotlight />

      <section id="evidence" className="hs-section">
        <p className="hs-kicker">Checked, not guessed</p>
        <h2 className="hs-section-title">Evidence, not vibes</h2>
        <p className="hs-section-lede">
          Every protein value comes from published food-composition tables and
          every price from Nigerian market price surveys and records. Prices
          that had to be derived are labelled derived — never dressed up as
          market quotes.
        </p>
        <details className="hs-evidence">
          <summary>How the numbers were verified</summary>
          <div className="hs-evidence-body">
            <p>
              <strong>Nutrition.</strong> Protein values were read directly from
              published composition entries: soy chunks 41.71 g/100 g; awara
              17.27 g/100 g; egusi 19.5 g/100 g; bambara 19.5 g/100 g; dawadawa
              33.1 g/100 g; seitan 25.0 g/100 g prepared (dry vital wheat gluten
              is 75.2 g/100 g before hydration); mushrooms 3.09 g/100 g (a
              white-mushroom proxy for Abuja oyster mushrooms, flagged as
              such); chicken 23.0 g/100 g; beef 20.3 g/100 g. The single derived
              nutrition value is soy milk (2.7 g/100 g), modelled from dry
              soybean with the arithmetic documented in the project records.
            </p>
            <p>
              <strong>Prices.</strong> Beef ₦6,375/kg is a 2026 retail survey
              median (228 observations); chicken ₦7,059/kg comes from Abuja
              retail price records; soy chunks ₦8,850/kg is packaged retail.
              Six prices are honestly labelled <em>derived/modelled</em>{" "}
              because no market series exists: awara ₦450/kg (from the ₦650/kg
              soybean price and a ~2 kg yield), bambara ₦960/kg (cowpea price
              band), egusi ₦1,591/kg (groundnut proxy — a floor value),
              dawadawa ₦5,000/kg (modelled placeholder, used at 5–10 g per
              serving), soy milk ₦900/L (the weakest price in the set), and
              seitan ₦2,000/kg (flour-wash derivation from ≈₦1,300/kg wheat
              flour at a ~0.65 kg yield per kg of flour; labour not costed).
              Survey prices are medians, not a live feed — no live price feed
              exists for Nigerian informal markets.
            </p>
            <p>
              <strong>Deliberately not used:</strong> global footprint tables
              that do not cover Nigeria, and crowdsourced product databases
              whose protein coverage is too patchy to trust (only 35 of 200
              Nigeria-tagged products carry protein values). Functional
              properties are qualitative, literature-based descriptors — not
              measurements.
            </p>
            <p>
              <strong>Legume caution:</strong> bambara groundnut and dawadawa
              are legumes but are not peanut, so they are not labelled peanut.
              The fail-closed peanut rule applies to actual groundnut/peanut —
              including the yaji in kebab.
            </p>
          </div>
        </details>
      </section>

      <JoinForm />

      <footer className="hs-footer">
        <p>
          <strong>HackSprout</strong> — built for Hack the Fork Nigeria 2026,
          Challenge 2: AI for Plant-Based Menu Innovation. Menu: Veggie Victory
          (Lagos), lapses fixed. A constraint-aware decision-support tool — not
          a guarantee of a perfect recipe; kitchen validation still matters.
        </p>
      </footer>
    </div>
  );
}
