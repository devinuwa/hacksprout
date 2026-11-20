import { NextResponse } from "next/server";
import { parseTransformRequest, transformDish } from "@/lib/transform";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/transform
 *
 * Engine v2: transform ONE existing dish's protein into a credible
 * plant-based alternative under hard constraints, with the reasoning in
 * the returned `trace`. Body: { dishId } for a catalogue dish
 * (lib/dishes.ts) or { dish: { name, currentProteinId, currentPortionG,
 * cookingMethod, sellingPriceNgn, baseComponentIds? } } for a user dish,
 * plus optional opts { budgetCapNgn, minProteinRatio, maxPrepMinutes,
 * avoidAllergens }. Strict validation — unknown fields and bad values
 * return 400 with a clear message, exactly like /api/explore.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON" }, { status: 400 });
  }

  try {
    const { dish, opts } = parseTransformRequest(body);
    const result = transformDish(dish, opts);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid request" },
      { status: 400 },
    );
  }
}
