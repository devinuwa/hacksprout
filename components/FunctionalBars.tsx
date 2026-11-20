/**
 * Functional-properties bar graph — the four cooking-behaviour properties
 * rendered as horizontal bars (Low = 1, Moderate = 2, High = 3 of 3).
 * Pure presentational component: no client JS, no chart library.
 * Levels are qualitative, literature-based descriptors — not measurements.
 */

export type FunctionalLevel = "High" | "Moderate" | "Low";

export interface FunctionalProfileShape {
  solubility: FunctionalLevel;
  waterHolding: FunctionalLevel;
  emulsification: FunctionalLevel;
  gelation: FunctionalLevel;
}

const VALUE: Record<FunctionalLevel, number> = { Low: 1, Moderate: 2, High: 3 };

const ROWS: { key: keyof FunctionalProfileShape; label: string }[] = [
  { key: "solubility", label: "Solubility" },
  { key: "waterHolding", label: "Water-holding" },
  { key: "emulsification", label: "Emulsification" },
  { key: "gelation", label: "Gelation" },
];

export default function FunctionalBars({
  profile,
  focus,
}: {
  profile: FunctionalProfileShape;
  /** Properties the dish's survival screen actually tests — marked with •. */
  focus?: (keyof FunctionalProfileShape)[];
}) {
  const summary = ROWS.map(
    ({ key, label }) => `${label} ${profile[key]}`,
  ).join(", ");
  return (
    <div className="fbars" role="img" aria-label={`Functional profile: ${summary}`}>
      {ROWS.map(({ key, label }) => (
        <div key={key} className="fbars-row">
          <span className="fbars-label">
            {label}
            {focus?.includes(key) ? " •" : ""}
          </span>
          <span className="fbars-track" aria-hidden="true">
            <span
              className="fbars-fill"
              style={{ width: `${(VALUE[profile[key]] / 3) * 100}%` }}
            />
          </span>
          <span className="fbars-level">{profile[key]}</span>
        </div>
      ))}
    </div>
  );
}
