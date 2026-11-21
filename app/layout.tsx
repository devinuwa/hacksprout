import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HackSprout — Diversify the protein. Revolutionise the plate.",
  description:
    "HackSprout redesigns the protein in dishes Nigerian restaurants already sell: cheaper per serving, protein target protected, checked against real kitchen constraints. Built for Hack the Fork Nigeria 2026.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
