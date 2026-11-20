# HackSprout

**Diversify the protein. Revolutionise the plate.**

HackSprout is a plant-based menu innovation tool for Nigerian kitchens,
built for **Hack the Fork Nigeria 2026, Challenge 2 — AI for Plant-Based
Menu Innovation**.

Most Nigerian meals are carbohydrate-first (rice, garri, yam, amala) with
protein as the expensive afterthought. HackSprout redesigns the protein in
dishes restaurants already sell — cheaper per serving, the protein target
protected, and every swap checked against the real constraints of a
Nigerian kitchen before it is recommended.

## What's on the page

1. **The menu, fixed** — the real Veggie Victory (Lagos) menu, audited:
   suya dishes renamed to kebab, one canonical price per dish (the
   homepage/menu-page conflicts resolved), the three ₦0 swallows shown at
   ₦1,000 with a footnote, allergen labels added (peanut in Papaya Salad,
   gluten in Vchunks, soy in tofu), every dish's protein source named, the
   missing Drinks and Big Bowls sections restored, and protein-led dishes
   carrying their functional-property line. A "What we fixed" section lists
   all six lapses in plain words.
2. **Kitchen Studio** — the constraint engine. Pick a dish context (kebab
   skewers, shawarma wrap, jollof protein side, egusi soup), set budget,
   protein target, prep time, equipment, stock and allergen exclusions.
   The engine composes protein × portion swaps from the verified catalogue
   and returns only what passes every hard constraint, ranked by a
   transparent score (cost 0.45 / protein 0.25 / time 0.15 /
   functional-fit 0.15).
3. **Functional properties spotlight** — solubility, water-holding,
   emulsification and gelation for every protein: the cooking behaviour
   that decides whether a swap survives the kitchen.
4. **Evidence strip** — every number carries its source; derived prices
   are labelled derived.
5. **Join form** — "Tell us about your kitchen". No auth, no accounts.

## Guardrails (non-negotiable, enforced in `lib/engine.ts`)

- **Hard constraints beat scores.** Budget, protein floor, time,
  equipment and stock are pass/fail; scoring only ranks survivors. If
  nothing survives, the API returns an honest "No eligible formulation"
  with the blocking constraints named — nothing is relaxed silently.
- **Allergen exclusions fail closed.** Synonyms are canonicalised
  (peanut = groundnut, soy = soya/soybean, gluten = wheat). A candidate
  is excluded if its protein *or any base component of the dish* carries
  an excluded allergen — excluding peanut removes every kebab candidate,
  because kebab here is served with groundnut yaji. Unknown allergen
  status excludes, never assumes safe. An exclusion outside the supported
  set is rejected with a 400 rather than silently ignored.
- **Strict API validation.** `POST /api/explore` rejects unknown fields,
  wrong types and out-of-range values with 400 and a clear message. The
  client and server share one schema (`parseExploreRequest`).
- **No invented numbers.** Cost = `priceNgnPerKg × portion / 1000`,
  protein = `proteinGPer100g × portion / 100`, straight from
  `lib/proteins.ts`. Dish base components are checked for allergens,
  equipment and stock but are not costed — figures are the cost of the
  protein swap, labelled as such. Animal proteins (chicken, beef) are
  comparison references only, never candidates.
- **Derived prices stay labelled.** Awara, bambara, egusi, dawadawa and
  soy-milk prices are derived/modelled (no market series exists) and are
  flagged in the UI wherever they are used.

## Data sources

- **FAO WAFCT 2019** — West African Food Composition Table (dish
  ingredients; egusi 06_035, bambara 03_001, dawadawa 03_042, chicken
  07_033, beef 07_023, groundnut 06_010).
- **USDA FoodData Central SR Legacy** — soy chunks "Meat extender"
  (FDC 174268), firm tofu (FDC 172475), mushrooms (FDC 169376).
- **WFP Food Prices for Nigeria** — beef 2026 retail median ₦6,375.43/kg
  (228 observations); cowpea/groundnut medians behind the derived
  bambara/egusi prices.
- **NBS Selected Food Price Watch** — cross-checks (e.g. beef boneless
  national average, same band as WFP).
- Menu: Veggie Victory, veggievictory.com/menu/, extracted 2026-11-20.

Functional properties are qualitative, literature-based descriptors —
not lab measurements. Full traceability, derivations and honest flags
live in the dataset's `DATA_SOURCES.md` and are summarised in the app's
Evidence section. Deliberately not used: HESTIA (no Nigeria coverage in
the release table) and Open Food Facts (crowdsourced, sparse protein
data).

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
# or production:
npm run build
npm run start
```

API:

- `POST /api/explore` — JSON body:
  `{ dishContext, budgetNgn, proteinTargetG, maxPrepMinutes, equipment,
  availableIngredients, avoidAllergens }`
  (`availableIngredients: null` = no stock restriction; allergen synonyms
  like "groundnut" are accepted and canonicalised.)
- `GET /api/menu` — the fixed menu with functional profiles attached.

## Deploy to Vercel

1. Push this folder to a GitHub repo.
2. In Vercel: **Add New → Project**, import the repo. Next.js is
   auto-detected; no build settings to change.
3. Optional environment variable: `NEXT_PUBLIC_LEAD_ENDPOINT` — the URL
   of a JSON-accepting inbox (e.g. a Formspree form endpoint) for the
   join form. If unset, the form runs in an honestly-labelled demo mode
   and sends nothing. No other env vars are needed.
4. Deploy. Every later push auto-redeploys.

## Layout

```
app/            page, layout, globals.css, api/explore, api/menu
components/     MenuExplorer, Studio, FunctionalSpotlight, JoinForm
lib/            proteins.ts + ingredients.ts (verified dataset — the only
                source of nutrition/price values), menu.ts, engine.ts
```
