"use client";

import { useState } from "react";

const KITCHEN_TYPES = [
  "buka/mama-put",
  "canteen",
  "fast food",
  "restaurant",
  "caterer",
  "other",
] as const;

/**
 * Where kitchen enquiries land: the team inbox, via FormSubmit's AJAX
 * endpoint. NEXT_PUBLIC_LEAD_ENDPOINT overrides it when set (e.g. a
 * Formspree URL) — the env value always wins.
 */
const FORMSUBMIT_ENDPOINT =
  "https://formsubmit.co/ajax/inuwamuhammad930@gmail.com";

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent" }
  | { kind: "error"; message: string };

export default function JoinForm() {
  const [fullName, setFullName] = useState("");
  const [kitchenName, setKitchenName] = useState("");
  const [kitchenType, setKitchenType] = useState<string>(KITCHEN_TYPES[0]);
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [dish, setDish] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [fieldError, setFieldError] = useState<string | null>(null);

  const endpoint =
    process.env.NEXT_PUBLIC_LEAD_ENDPOINT?.trim() || FORMSUBMIT_ENDPOINT;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldError(null);
    if (!fullName.trim() || !city.trim() || !phone.trim()) {
      setFieldError("Please fill in your name, city and phone/WhatsApp number.");
      return;
    }
    if (!consent) {
      setFieldError("Please tick the consent box so we may contact you.");
      return;
    }
    const payload = {
      _subject: "HackSprout — new kitchen enquiry",
      _template: "table",
      fullName: fullName.trim(),
      kitchenName: kitchenName.trim(),
      kitchenType,
      city: city.trim(),
      phone: phone.trim(),
      dishToRedesign: dish.trim(),
      consent: true,
      source: "hacksprout-join-form",
    };
    setStatus({ kind: "sending" });
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Inbox returned ${res.status}`);
      setStatus({ kind: "sent" });
    } catch {
      // Honest failure: nothing was sent, and the typed entry stays on
      // screen so the user can retry without re-typing.
      setStatus({
        kind: "error",
        message:
          "We could not send your message just now — nothing was sent. Your entries are still here; please try again.",
      });
    }
  }

  return (
    <section id="join" className="hs-section">
      <p className="hs-kicker">Work with us</p>
      <h2 className="hs-section-title">Tell us about your kitchen</h2>
      <p className="hs-section-lede">
        No account, no password. Tell us who you are and the dish you would
        redesign first, and we will reach out on WhatsApp with a worked swap for
        your kitchen.
      </p>
      <form className="hs-panel hs-join" onSubmit={onSubmit} noValidate={false}>
        <div className="hs-grid2">
          <label className="hs-field">
            <span className="hs-label">Full name *</span>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </label>
          <label className="hs-field">
            <span className="hs-label">Kitchen / restaurant name</span>
            <input
              type="text"
              value={kitchenName}
              onChange={(e) => setKitchenName(e.target.value)}
            />
          </label>
          <label className="hs-field">
            <span className="hs-label">Type of kitchen</span>
            <select value={kitchenType} onChange={(e) => setKitchenType(e.target.value)}>
              {KITCHEN_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="hs-field">
            <span className="hs-label">City *</span>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
          </label>
          <label className="hs-field">
            <span className="hs-label">Phone / WhatsApp *</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </label>
          <label className="hs-field">
            <span className="hs-label">Dish you would redesign first</span>
            <input
              type="text"
              value={dish}
              onChange={(e) => setDish(e.target.value)}
              placeholder="e.g. chicken shawarma"
            />
          </label>
        </div>
        <label className="hs-check">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          You can contact me about HackSprout on the number above.
        </label>
        {fieldError && <p className="hs-alert--error">{fieldError}</p>}
        <button type="submit" className="hs-button" disabled={status.kind === "sending"}>
          {status.kind === "sending" ? "Sending…" : "Send"}
        </button>
        {status.kind === "sent" && (
          <p className="hs-warning" role="status">
            Thank you — your message was sent to the team inbox. We will reach
            out on WhatsApp.
          </p>
        )}
        {status.kind === "error" && (
          <p className="hs-alert--error" role="alert">
            {status.message}
          </p>
        )}
      </form>
    </section>
  );
}
