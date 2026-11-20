import { NextResponse } from "next/server";
import { parseTransformMenuRequest, transformMenu } from "@/lib/transform";
import { TRANSFORMABLE_DISHES } from "@/lib/dishes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/transform-menu
 *
 * Engine v2, whole-menu mode: transform every dish in
 * TRANSFORMABLE_DISHES (lib/dishes.ts) under the same opts and return
 * per-dish results plus computed aggregates (survivor count, median cost
 * and protein deltas, rejection totals by reason). Body: {} or opts
 * { budgetCapNgn, minProteinRatio, maxPrepMinutes, avoidAllergens }.
 * Strict validation — unknown fields and bad values return 400.
 */
export async function POST(request: Request) {
  let body: unknown = {};
  try {
    const text = await request.text();
    body = text.trim().length > 0 ? JSON.parse(text) : {};
  } catch {
    return NextResponse.json({ error: "Request body must be JSON" }, { status: 400 });
  }

  try {
    const opts = parseTransformMenuRequest(body);
    const result = transformMenu(TRANSFORMABLE_DISHES, opts);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid request" },
      { status: 400 },
    );
  }
}
