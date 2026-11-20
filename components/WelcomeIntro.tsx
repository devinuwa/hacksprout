"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PROTEIN_IMAGE_IDS, proteinImageSrc } from "@/lib/protein-images";

/**
 * Welcome intro — shown once per session on first view.
 *
 * A full-screen overlay introduces HackSprout while the eight plant-protein
 * photos pop in one after another; it then fades away on its own (~3 s) or
 * the moment the visitor clicks Enter / presses Escape. It never renders
 * again in the same session (sessionStorage flag), never traps the user,
 * and renders nothing at all if storage or JS is unavailable — the page
 * behind it is always fully usable.
 */

const STORAGE_KEY = "hacksprout-intro-seen-v1";
const AUTO_DISMISS_MS = 3000;
const FADE_MS = 480;

const TILE_LABELS: Record<string, string> = {
  "soy-chunks": "Soy chunks",
  awara: "Awara",
  seitan: "Seitan",
  bambara: "Bambara",
  egusi: "Egusi",
  mushrooms: "Mushrooms",
  "soy-milk": "Soy milk",
  dawadawa: "Dawadawa",
};

type Phase = "off" | "on" | "leaving";

export default function WelcomeIntro() {
  const [phase, setPhase] = useState<Phase>("off");
  const timers = useRef<number[]>([]);

  const dismiss = useCallback(() => {
    setPhase((p) => {
      if (p !== "on") return p;
      timers.current.push(window.setTimeout(() => setPhase("off"), FADE_MS));
      return "leaving";
    });
  }, []);

  useEffect(() => {
    let seen = true;
    try {
      seen = sessionStorage.getItem(STORAGE_KEY) === "1";
      if (!seen) sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Storage unavailable (private mode etc.) — never show the intro
      // rather than risk showing it on every navigation.
      seen = true;
    }
    if (seen) return;
    setPhase("on");
    timers.current.push(window.setTimeout(dismiss, AUTO_DISMISS_MS));
    const t = timers.current;
    return () => {
      t.forEach((id) => window.clearTimeout(id));
    };
  }, [dismiss]);

  useEffect(() => {
    if (phase !== "on") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, dismiss]);

  if (phase === "off") return null;

  return (
    <div
      className={`wi-overlay${phase === "leaving" ? " wi-overlay--leaving" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to HackSprout"
    >
      <div className="wi-inner">
        <p className="wi-brand">HackSprout</p>
        <p className="wi-tagline">Diversify the protein. Revolutionise the plate.</p>
        <p className="wi-about">
          We take the dishes already on hospital and restaurant menus and
          transform their protein — animal out, plant-based in — holding the
          protein content, the budget and the dish itself.
        </p>
        <div className="wi-grid" aria-hidden="true">
          {PROTEIN_IMAGE_IDS.map((id, i) => {
            const src = proteinImageSrc(id);
            return (
              <figure
                key={id}
                className="wi-tile"
                style={{ animationDelay: `${150 + i * 170}ms` }}
              >
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt="" />
                ) : (
                  <div className="wi-tile-empty" />
                )}
                <figcaption>{TILE_LABELS[id] ?? id}</figcaption>
              </figure>
            );
          })}
        </div>
        <button type="button" className="wi-enter" onClick={dismiss} autoFocus>
          Enter HackSprout →
        </button>
        <p className="wi-note">Protein photos are AI-generated illustrations.</p>
      </div>
    </div>
  );
}
